const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { before, after, test } = require('node:test');
const { initializeTestEnvironment } = require('@firebase/rules-unit-testing');

const projectId = 'demo-entredos';
const rules = fs.readFileSync(path.join(__dirname, '..', 'FIREBASE_REGLAS_PRUEBA.json'), 'utf8');

let env;
before(async () => {
  env = await initializeTestEnvironment({
    projectId,
    database: { host: '127.0.0.1', port: 9000, rules }
  });
});
after(async () => {
  if (env) await env.cleanup();
});

const denied = (promise) => assert.rejects(promise, /PERMISSION_DENIED|permission_denied|permission denied/i);

async function seedPair(pairId, partnerUid) {
  await env.withSecurityRulesDisabled(async (ctx) => {
    const pair = {
      ownerUid: 'owner',
      status: 'pending',
      ownerConsent: false,
      partnerConsent: false
    };
    if (partnerUid) pair.partnerUid = partnerUid;
    await ctx.database().ref('pairs/' + pairId).set(pair);
  });
}

test('owner verification, single-use claim, consent, location privacy and irreversible revocation', async () => {
  const owner = env.authenticatedContext('owner', {
    email_verified: true,
    firebase: { sign_in_provider: 'password' }
  }).database();
  const unverified = env.authenticatedContext('unverified', {
    email_verified: false,
    firebase: { sign_in_provider: 'password' }
  }).database();
  const partner = env.authenticatedContext('partner', {
    firebase: { sign_in_provider: 'anonymous' }
  }).database();
  const secondPartner = env.authenticatedContext('second-partner', {
    firebase: { sign_in_provider: 'anonymous' }
  }).database();
  const stranger = env.authenticatedContext('stranger', {
    firebase: { sign_in_provider: 'anonymous' }
  }).database();

  await owner.ref('pairs/create-ok').set({
    ownerUid: 'owner',
    status: 'pending',
    ownerConsent: false,
    partnerConsent: false
  });
  await denied(unverified.ref('pairs/create-no').set({
    ownerUid: 'unverified',
    status: 'pending',
    ownerConsent: false,
    partnerConsent: false
  }));

  await seedPair('p1');
  assert.equal((await partner.ref('pairs/p1').get()).val().status, 'pending');
  await partner.ref('pairs/p1/partnerUid').set('partner');
  await denied(secondPartner.ref('pairs/p1/partnerUid').set('second-partner'));

  await owner.ref('pairs/p1/ownerConsent').set(true);
  await denied(owner.ref('locations/p1/owner').set({ lat: 40, lng: -3, updatedAt: 1 }));
  // Activation must be denied until the partner has also consented.
  await denied(owner.ref('pairs/p1/status').set('active'));
  await partner.ref('pairs/p1/partnerConsent').set(true);
  await owner.ref('pairs/p1/status').set('active');

  await owner.ref('locations/p1/owner').set({ lat: 40, lng: -3, updatedAt: 2 });
  await partner.ref('locations/p1/partner').set({ lat: 41, lng: -4, updatedAt: 3 });
  await denied(stranger.ref('locations/p1/owner').get());
  await denied(partner.ref('locations/p1/owner').set({ lat: 0, lng: 0, updatedAt: 4 }));

  // If either person withdraws consent, location access must stop immediately
  // and the same consent must not be granted again on the active pair.
  await partner.ref('pairs/p1/partnerConsent').set(false);
  await denied(partner.ref('locations/p1/partner').get());
  await denied(partner.ref('pairs/p1/partnerConsent').set(true));

  await owner.ref().update({
    'pairs/p1/status': 'revoked',
    'pairs/p1/ownerConsent': false,
    'pairs/p1/partnerConsent': false,
    'locations/p1': null
  });

  const revoked = (await owner.ref('pairs/p1').get()).val();
  assert.equal(revoked.status, 'revoked');
  assert.equal(revoked.ownerConsent, false);
  assert.equal(revoked.partnerConsent, false);
  await env.withSecurityRulesDisabled(async (ctx) => {
    assert.equal((await ctx.database().ref('locations/p1').get()).exists(), false);
  });

  
  // A partner must also be able to close the link with the same atomic
  // status + own-consent + location-delete update used by the UI.
  await seedPair('p2', 'partner');
  await owner.ref('pairs/p2/ownerConsent').set(true);
  await partner.ref('pairs/p2/partnerConsent').set(true);
  await owner.ref('pairs/p2/status').set('active');
  await owner.ref('locations/p2/owner').set({ lat: 40, lng: -3, updatedAt: 5 });
  await partner.ref().update({
    'pairs/p2/status': 'revoked',
    'pairs/p2/partnerConsent': false,
    'locations/p2': null
  });
  assert.equal((await partner.ref('pairs/p2/status').get()).val(), 'revoked');
  assert.equal((await partner.ref('pairs/p2/partnerConsent').get()).val(), false);
  await env.withSecurityRulesDisabled(async (ctx) => {
    assert.equal((await ctx.database().ref('locations/p2').get()).exists(), false);
  });
  await denied(owner.ref('pairs/p2/status').set('active'));
  await denied(partner.ref('pairs/p2/partnerConsent').set(true));

  await denied(owner.ref('pairs/p1/status').set('active'));
  await denied(partner.ref('pairs/p1/partnerConsent').set(true));
  await denied(secondPartner.ref('pairs/p1/partnerUid').set('second-partner'));
  await denied(stranger.ref('locations/p1/owner').get());

  // Root access and the old invitations schema must remain closed.
  await denied(stranger.ref('/').get());
  await denied(owner.ref('/').set({ unexpected: true }));
  await denied(owner.ref('invitations/legacy').set({ creatorUid: 'owner', status: 'pending' }));
});
