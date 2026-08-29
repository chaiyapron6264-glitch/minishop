type QrSegment = {
  mode: number;
  length: number;
  data: number[];
};

const errorCorrectionCodewordsPerBlock = 24;
const dataCodewords = 86;
const size = 37;
const blockDataCodewords = 43;
const alphanumericCharacters = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:";

const gfExp = new Array<number>(512);
const gfLog = new Array<number>(256);

let value = 1;
for (let index = 0; index < 255; index += 1) {
  gfExp[index] = value;
  gfLog[value] = index;
  value <<= 1;
  if (value & 0x100) {
    value ^= 0x11d;
  }
}
for (let index = 255; index < 512; index += 1) {
  gfExp[index] = gfExp[index - 255];
}

const gfMultiply = (left: number, right: number) => {
  if (left === 0 || right === 0) {
    return 0;
  }

  return gfExp[gfLog[left] + gfLog[right]];
};

const appendBits = (target: number[], valueToAppend: number, length: number) => {
  for (let index = length - 1; index >= 0; index -= 1) {
    target.push((valueToAppend >>> index) & 1);
  }
};

const getAlphanumericSegment = (text: string): QrSegment => {
  const bits: number[] = [];

  for (let index = 0; index < text.length; index += 2) {
    const first = alphanumericCharacters.indexOf(text[index] ?? "");
    const second =
      index + 1 < text.length
        ? alphanumericCharacters.indexOf(text[index + 1] ?? "")
        : -1;

    if (first < 0 || (index + 1 < text.length && second < 0)) {
      throw new Error("QR payload contains unsupported characters");
    }

    if (second >= 0) {
      appendBits(bits, first * 45 + second, 11);
    } else {
      appendBits(bits, first, 6);
    }
  }

  return { mode: 0b0010, length: text.length, data: bits };
};

const getGeneratorPolynomial = (degree: number) => {
  const result = new Array<number>(degree).fill(0);
  result[degree - 1] = 1;
  let root = 1;

  for (let index = 0; index < degree; index += 1) {
    for (let coefficientIndex = 0; coefficientIndex < result.length; coefficientIndex += 1) {
      result[coefficientIndex] = gfMultiply(result[coefficientIndex] ?? 0, root);

      if (coefficientIndex + 1 < result.length) {
        result[coefficientIndex] ^= result[coefficientIndex + 1] ?? 0;
      }
    }

    root = gfMultiply(root, 0x02);
  }

  return result;
};

const getErrorCorrection = (data: number[]) => {
  const generator = getGeneratorPolynomial(errorCorrectionCodewordsPerBlock);
  const result = new Array<number>(errorCorrectionCodewordsPerBlock).fill(0);

  data.forEach((byte) => {
    const factor = byte ^ (result.shift() ?? 0);
    result.push(0);

    generator.forEach((coefficient, index) => {
      if (factor !== 0) {
        result[index] = (result[index] ?? 0) ^ gfMultiply(coefficient, factor);
      }
    });
  });

  return result;
};

const getDataCodewords = (text: string) => {
  const segment = getAlphanumericSegment(text);
  const bits: number[] = [];
  appendBits(bits, segment.mode, 4);
  appendBits(bits, segment.length, 9);
  bits.push(...segment.data);
  appendBits(bits, 0, Math.min(4, dataCodewords * 8 - bits.length));

  while (bits.length % 8 !== 0) {
    bits.push(0);
  }

  const bytes: number[] = [];
  for (let index = 0; index < bits.length; index += 8) {
    bytes.push(
      bits
        .slice(index, index + 8)
        .reduce((sum, bit) => (sum << 1) | bit, 0),
    );
  }

  for (let index = 0; bytes.length < dataCodewords; index += 1) {
    bytes.push(index % 2 === 0 ? 0xec : 0x11);
  }

  return bytes;
};

const getFinalCodewords = (data: number[]) => {
  const blocks = [
    data.slice(0, blockDataCodewords),
    data.slice(blockDataCodewords, blockDataCodewords * 2),
  ];
  const errorBlocks = blocks.map(getErrorCorrection);
  const result: number[] = [];

  for (let index = 0; index < blockDataCodewords; index += 1) {
    blocks.forEach((block) => result.push(block[index] ?? 0));
  }

  for (let index = 0; index < errorCorrectionCodewordsPerBlock; index += 1) {
    errorBlocks.forEach((block) => result.push(block[index] ?? 0));
  }

  return result;
};

const createMatrix = () => ({
  modules: Array.from({ length: size }, () => new Array<boolean>(size).fill(false)),
  reserved: Array.from({ length: size }, () => new Array<boolean>(size).fill(false)),
});

const setModule = (
  matrix: ReturnType<typeof createMatrix>,
  x: number,
  y: number,
  dark: boolean,
  reserve = true,
) => {
  if (x < 0 || y < 0 || x >= size || y >= size) {
    return;
  }

  matrix.modules[y][x] = dark;
  if (reserve) {
    matrix.reserved[y][x] = true;
  }
};

const drawFinder = (matrix: ReturnType<typeof createMatrix>, x: number, y: number) => {
  for (let dy = -1; dy <= 7; dy += 1) {
    for (let dx = -1; dx <= 7; dx += 1) {
      const xx = x + dx;
      const yy = y + dy;
      const isFinder =
        dx >= 0 &&
        dx <= 6 &&
        dy >= 0 &&
        dy <= 6 &&
        (dx === 0 ||
          dx === 6 ||
          dy === 0 ||
          dy === 6 ||
          (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4));
      setModule(matrix, xx, yy, isFinder);
    }
  }
};

const drawAlignment = (
  matrix: ReturnType<typeof createMatrix>,
  centerX: number,
  centerY: number,
) => {
  for (let dy = -2; dy <= 2; dy += 1) {
    for (let dx = -2; dx <= 2; dx += 1) {
      setModule(
        matrix,
        centerX + dx,
        centerY + dy,
        Math.max(Math.abs(dx), Math.abs(dy)) !== 1,
      );
    }
  }
};

const drawFunctionPatterns = (matrix: ReturnType<typeof createMatrix>) => {
  drawFinder(matrix, 0, 0);
  drawFinder(matrix, size - 7, 0);
  drawFinder(matrix, 0, size - 7);

  [6, 30].forEach((x) => {
    [6, 30].forEach((y) => {
      const nearFinder =
        (x === 6 && y === 6) ||
        (x === 30 && y === 6) ||
        (x === 6 && y === 30);
      if (!nearFinder) {
        drawAlignment(matrix, x, y);
      }
    });
  });

  for (let index = 8; index < size - 8; index += 1) {
    setModule(matrix, index, 6, index % 2 === 0);
    setModule(matrix, 6, index, index % 2 === 0);
  }

  setModule(matrix, 8, size - 8, true);

  for (let index = 0; index < 9; index += 1) {
    if (index !== 6) {
      matrix.reserved[8][index] = true;
      matrix.reserved[index][8] = true;
    }
  }

  for (let index = 0; index < 8; index += 1) {
    matrix.reserved[8][size - 1 - index] = true;
    matrix.reserved[size - 1 - index][8] = true;
  }
};

const mask = (x: number, y: number) => (x + y) % 2 === 0;

const drawData = (matrix: ReturnType<typeof createMatrix>, bytes: number[]) => {
  const bits = bytes.flatMap((byte) =>
    Array.from({ length: 8 }, (_, index) => (byte >>> (7 - index)) & 1),
  );
  let bitIndex = 0;
  let upward = true;

  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) {
      right -= 1;
    }

    for (let vertical = 0; vertical < size; vertical += 1) {
      const y = upward ? size - 1 - vertical : vertical;

      for (let column = 0; column < 2; column += 1) {
        const x = right - column;

        if (matrix.reserved[y][x]) {
          continue;
        }

        const bit = bitIndex < bits.length ? bits[bitIndex] === 1 : false;
        setModule(matrix, x, y, bit !== mask(x, y), false);
        bitIndex += 1;
      }
    }

    upward = !upward;
  }
};

const drawFormatBits = (matrix: ReturnType<typeof createMatrix>) => {
  const formatBits = 0b101010000010010;

  for (let index = 0; index <= 5; index += 1) {
    setModule(matrix, 8, index, ((formatBits >>> index) & 1) !== 0);
  }
  setModule(matrix, 8, 7, ((formatBits >>> 6) & 1) !== 0);
  setModule(matrix, 8, 8, ((formatBits >>> 7) & 1) !== 0);
  setModule(matrix, 7, 8, ((formatBits >>> 8) & 1) !== 0);
  for (let index = 9; index < 15; index += 1) {
    setModule(matrix, 14 - index, 8, ((formatBits >>> index) & 1) !== 0);
  }

  for (let index = 0; index < 8; index += 1) {
    setModule(matrix, size - 1 - index, 8, ((formatBits >>> index) & 1) !== 0);
  }
  for (let index = 8; index < 15; index += 1) {
    setModule(matrix, 8, size - 15 + index, ((formatBits >>> index) & 1) !== 0);
  }
};

export function createQrMatrix(text: string) {
  const data = getDataCodewords(text);
  const finalCodewords = getFinalCodewords(data);
  const matrix = createMatrix();

  drawFunctionPatterns(matrix);
  drawData(matrix, finalCodewords);
  drawFormatBits(matrix);

  return matrix.modules;
}
