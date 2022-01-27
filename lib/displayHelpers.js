import { Bech32, fromBase64, toBase64 } from "@cosmjs/encoding";
import { sha512 } from "@cosmjs/crypto";
import { Decimal } from "@cosmjs/math";

/**
 * Abbreviates long strings, typically used for
 * addresses and transaction hashes.
 *
 * @param {string} longString The string to abbreviate.
 * @return {string} The abbreviated string.
 */
const abbreviateLongString = (longString) => {
  if (longString.length < 13) {
    // no need to abbreviate
    return longString;
  }

  return longString.slice(0, 5) + "..." + longString.slice(-5);
};

// NARROW NO-BREAK SPACE (U+202F)
const thinSpace = "\u202F";

// Takes a Coin (e.g. `{"amount": "1234", "denom": "uatom"}`) and converts it
// into a user-readable string.
//
// The configured NEXT_PUBLIC_DISPLAY_DENOM/NEXT_PUBLIC_DISPLAY_DENOM_EXPONENT
// will be used if the denom matches NEXT_PUBLIC_DENOM.
//
// A leading "u" is interpreted as µ (micro) and uxyz will be converted to XYZ
// for displaying.
const printableCoin = (coin) => {
  // null, undefined and this sort of things
  if (!coin) return "–";

  // The display denom from configuration
  if (coin.denom === process.env.NEXT_PUBLIC_DENOM) {
    const exponent = Number(process.env.NEXT_PUBLIC_DISPLAY_DENOM_EXPONENT);
    const value = Decimal.fromAtomics(coin.amount ?? "0", exponent).toString();
    const ticker = process.env.NEXT_PUBLIC_DISPLAY_DENOM;
    return value + thinSpace + ticker;
  }

  // Auto-convert leading "u"s
  if (coin.denom?.startsWith("u")) {
    const value = Decimal.fromAtomics(coin.amount ?? "0", 6).toString();
    const ticker = coin.denom.slice(1).toUpperCase();
    return value + thinSpace + ticker;
  }

  // Fallback to plain coin display
  return coin.amount + thinSpace + coin.denom;
};

const printableCoins = (coins) => {
  if (coins.length !== 1) {
    throw new Error("Implementation only supports exactly one coin entry.");
  }
  return printableCoin(coins[0]);
};

/**
 * Generates an example address for the configured blockchain.
 *
 * `index` can be set to a small integer in order to get different addresses. Defaults to 0.
 */
const exampleAddress = (index) => {
  const usedIndex = index || 0;
  let data = Bech32.decode("cosmos1vqpjljwsynsn58dugz0w8ut7kun7t8ls2qkmsq").data;
  for (let i = 0; i < usedIndex; ++i) {
    data = sha512(data).slice(0, data.length); // hash one time and trim to original length
  }
  return Bech32.encode(process.env.NEXT_PUBLIC_ADDRESS_PREFIX, data);
};

/**
 * Generates an example pubkey (secp256k1, compressed).
 *
 * `index` can be set to a small integer in order to get different addresses. Defaults to 0.
 *
 * Note: the keys are not necessarily valid (as in points on the chain) and should only be used
 * as dummy data.
 */
const examplePubkey = (index) => {
  const usedIndex = index || 0;
  let data = fromBase64("Akd/qKMWdZXyiMnSu6aFLpQEGDO0ijyal9mXUIcVaPNX");
  for (let i = 0; i < usedIndex; ++i) {
    data = sha512(data).slice(0, data.length); // hash one time and trim to original length
    data[0] = index % 2 ? 0x02 : 0x03; // pubkeys have to start with 0x02 or 0x03
  }
  return toBase64(data);
};

/**
 * Returns an error message for invalid addresses.
 *
 * Returns null of there is no error.
 */
const checkAddress = (input) => {
  if (!input) return "Empty";

  let data;
  let prefix;
  try {
    ({ data, prefix } = Bech32.decode(input));
  } catch (error) {
    return error.toString();
  }

  if (prefix !== process.env.NEXT_PUBLIC_ADDRESS_PREFIX) {
    return `Expected address prefix '${process.env.NEXT_PUBLIC_ADDRESS_PREFIX}' but got '${prefix}'`;
  }

  if (data.length !== 20) {
    return "Invalid address length in bech32 data. Must be 20 bytes.";
  }

  return null;
};

/**
 * Returns a link to a transaction in an explorer if an explorer is configured
 * for transactions. Returns null otherwise.
 */
const explorerLinkTx = (hash) => {
  if (process.env.NEXT_PUBLIC_EXPLORER_LINK_TX) {
    return process.env.NEXT_PUBLIC_EXPLORER_LINK_TX.replace("%s", hash);
  }
  return null;
};

export {
  abbreviateLongString,
  printableCoin,
  printableCoins,
  exampleAddress,
  examplePubkey,
  checkAddress,
  explorerLinkTx,
};
