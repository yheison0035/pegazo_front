const { default: Image } = require('next/image');

const ImagesProcessor = ({ name, width, height, alt }) => {
  return <Image src={name} width={width} height={height} alt={alt} />;
};

export default ImagesProcessor;
