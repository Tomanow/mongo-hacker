function base64ToHex(base64) {
  const base64Digits = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  const hexDigits = '0123456789abcdef';
  let hex = '';
  for (const i = 0; i < 24;) {
    let e1 = base64Digits.indexOf(base64[i++]);
    let e2 = base64Digits.indexOf(base64[i++]);
    let e3 = base64Digits.indexOf(base64[i++]);
    let e4 = base64Digits.indexOf(base64[i++]);
    let c1 = (e1 << 2) | (e2 >> 4);
    let c2 = ((e2 & 15) << 4) | (e3 >> 2);
    let c3 = ((e3 & 3) << 6) | e4;
    hex += hexDigits[c1 >> 4];
    hex += hexDigits[c1 & 15];
    if (e3 !== 64) {
      hex += hexDigits[c2 >> 4];
      hex += hexDigits[c2 & 15];
    }
    if (e4 !== 64) {
      hex += hexDigits[c3 >> 4];
      hex += hexDigits[c3 & 15];
    }
  }
  return hex;
}

function hexToBase64(hex) {
  const base64Digits = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let base64 = '';
  let group;
  for (let i = 0; i < 30; i += 6) {
    group = parseInt(hex.substr(i, 6), 16);
    base64 += base64Digits[(group >> 18) & 0x3f];
    base64 += base64Digits[(group >> 12) & 0x3f];
    base64 += base64Digits[(group >> 6) & 0x3f];
    base64 += base64Digits[group & 0x3f];
  }
  group = parseInt(hex.substr(30, 2), 16);
  base64 += base64Digits[(group >> 2) & 0x3f];
  base64 += base64Digits[(group << 4) & 0x3f];
  base64 += '==';
  return base64;
}

const platformSpecificUuidModifications = {
  'java':       function(hex) {
    let msb = hex.substr(0, 16);
    let lsb = hex.substr(16, 16);
    msb = msb.substr(14, 2) + msb.substr(12, 2) + msb.substr(10, 2) +
          msb.substr(8, 2) + msb.substr(6, 2) + msb.substr(4, 2) +
          msb.substr(2, 2) + msb.substr(0, 2);
    lsb = lsb.substr(14, 2) + lsb.substr(12, 2) + lsb.substr(10, 2) +
          lsb.substr(8, 2) + lsb.substr(6, 2) + lsb.substr(4, 2) +
          lsb.substr(2, 2) + lsb.substr(0, 2);
    return msb + lsb;
  }, 'c#':      function(hex) {
    return hex.substr(6, 2) + hex.substr(4, 2) + hex.substr(2, 2) +
           hex.substr(0, 2) + hex.substr(10, 2) + hex.substr(8, 2) +
           hex.substr(14, 2) + hex.substr(12, 2) + hex.substr(16, 16);
  }, 'python':  function(hex) {
    return hex;
  }, 'default': function(hex) {
    return hex;
  },
};

function UUID(uuid, type) {
  let hex = uuid.replace(/[{}-]/g, '');
  let typeNum = 4;
  if (type !== undefined) {
    typeNum = 3;
    hex = platformSpecificUuidModifications[type](hex);
  }
  return new BinData(typeNum, hexToBase64(hex));
}

function uuidToString(uuid, uuidType) {
  uuidType = uuidType || mongo_hacker_config['uuid_type'];
  const hex = platformSpecificUuidModifications[uuidType](
      base64ToHex(uuid.base64()));
  return hex.substr(0, 8) + '-' + hex.substr(8, 4) + '-' + hex.substr(12, 4) +
         '-' + hex.substr(16, 4) + '-' + hex.substr(20, 12);
}
