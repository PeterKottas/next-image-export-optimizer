/// <reference types="react" />
import { ImageProps, StaticImageData } from "next/image";
export interface ExportedImageProps extends Omit<ImageProps, "src" | "loader" | "quality"> {
    src: string | StaticImageData;
}
declare function ExportedImage({ src, priority, loading, className, width, height, onLoadingComplete, unoptimized, placeholder, blurDataURL, style, onError, ...rest }: ExportedImageProps): JSX.Element;
export default ExportedImage;
