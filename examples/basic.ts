import { computePool, configure, createPool, joinPool, verifyResult } from '@arxpool-hq/sdk';

async function runExample() {
  const attesterSecret = process.env.ARXPOOL_ATTESTER_SECRET;
  if (!attesterSecret) {
    throw new Error('Set ARXPOOL_ATTESTER_SECRET before running the example');
  }

  configure({
    attesterSecret,
    mxeId: process.env.ARXPOOL_MXE_ID ?? 'demo-mxe',
    arciumApiKey: process.env.ARCIUM_API_KEY
  });

  await createPool({
    id: 'poll-123',
    mode: 'tally',
    metadata: { topic: 'privacy-demo' }
  });

  await joinPool('poll-123', {
    ciphertext: 'b64-DUMMY-CIPHERTEXT',
    senderPubkey: 'Base58DummyPubKey11111111111111111111111111111111111'
  });

  const signed = await computePool('poll-123', { dryRun: true });
  const verified = verifyResult(signed);
  console.log('Verification passed?', verified);
}

runExample().catch((error) => {
  console.error(error);
  process.exit(1);
});
