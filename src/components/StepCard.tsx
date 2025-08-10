import Image, { StaticImageData } from "next/image";

interface StepCardProps {
  /** Controls whether image is on left (false) or right (true) */
  imageOnRight?: boolean;
  label?: string;
  /** Custom title text */
  title?: string;
  /** Custom description text */
  description?: string;
  /** Custom image source */
  imageSrc: StaticImageData;
  /** Custom image alt text */
  imageAlt: string;
}

const StepCard: React.FC<StepCardProps> = ({
  imageOnRight,
  label,
  title,
  description,
  imageSrc,
  imageAlt
}) => {
  const imageElement = (
    <div className="flex-1">
      <Image src={imageSrc} alt={imageAlt} className="rounded-3xl"/>
    </div>
  );

  const textElement = (
    <div className="flex-1 flex-col justify-center space-y-4 sm:space-y-6">
        <h4 className="text-lg sm:text-xl text-blue-500 font-semibold">
            {label}
        </h4>
        <h1 className="text-3xl sm:text-5xl font-bold text-white leading-tight">
            {title}
        </h1>
        <p className="text-md sm:text-lg text-slate-400 leading-relaxed">
            {description}
        </p>
    </div>
  );

  return (
    <div className="flex justify-center p-8 w-[80vw]">
      <div className={"flex flex-col lg:flex-row justify-between items-center gap-12 lg:gap-16 w-full"}>
        {imageOnRight ? (
          // <>
          <div className="flex flex-col-reverse lg:flex-row justify-between items-center gap-12 lg:gap-16 w-full">
            {textElement}
            {imageElement}
          </div>
          // </>
        ) : (
          <>
            {imageElement}
            {textElement}
          </>
        )}
      </div>
    </div>
  );
};

export default StepCard;