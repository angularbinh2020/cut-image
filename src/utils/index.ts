export const getPreviewImageWidth = (imageTitleSize: number) => {
  const maxNumber = 9;
  const minNumber = 2;
  const standardSize = 256;
  const absoluteDifference = (number) => Math.abs(number - standardSize);
  let result = imageTitleSize;
  for (
    let divisionNumber = maxNumber;
    divisionNumber >= minNumber;
    divisionNumber--
  ) {
    const calculationResult = imageTitleSize / divisionNumber;
    if (calculationResult === Math.ceil(calculationResult)) {
      if (absoluteDifference(result) > absoluteDifference(calculationResult)) {
        result = calculationResult;
      } else {
        break;
      }
    }
  }
  return result;
};

const getFaceImageName = (fileName) => {
  switch (fileName) {
    case 'nx':
      return 'l';
    case 'pz':
      return 'f';
    case 'px':
      return 'r';
    case 'nz':
      return 'b';
    case 'py':
      return 'u';
    case 'ny':
      return 'd';
    default: {
      console.log('image file name not match nx, ny, nz or px, py ,pz');
      return fileName;
    }
  }
};

const getImageNameFormFileName = (fileName) => {
  const subStrings = fileName.split('.');
  return subStrings[0];
};

export const getFaceNameByFileName = (fileNameWithType: string) => {
  const fileName = getImageNameFormFileName(fileNameWithType);
  return getFaceImageName(fileName);
};
