/// <reference types="react" />
import { ImageProps, StaticImageData } from "next/legacy/image";
export interface ExportedImageProps extends Omit<ImageProps, "src" | "loader" | "quality"> {
    src: string | StaticImageData;
}
declare function ExportedImage({ src, priority, loading, lazyRoot, lazyBoundary, className, width, height, objectFit, objectPosition, onLoadingComplete, unoptimized, placeholder, blurDataURL, onError, ...rest }: ExportedImageProps): JSX.Element;
export default ExportedImage;
