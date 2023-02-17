import React, { useMemo, useState } from "react";
import Image from "next/image";
const splitFilePath = ({ filePath }) => {
    const filenameWithExtension = filePath.split("\\").pop()?.split("/").pop() || "";
    const filePathWithoutFilename = filePath.split(filenameWithExtension).shift();
    const fileExtension = filePath.split(".").pop();
    const filenameWithoutExtension = filenameWithExtension.substring(0, filenameWithExtension.lastIndexOf(".")) || filenameWithExtension;
    return {
        path: filePathWithoutFilename,
        filename: filenameWithoutExtension,
        extension: fileExtension || "",
    };
};
const generateImageURL = (src, width) => {
    const { filename, path, extension } = splitFilePath({ filePath: src });
    const useWebp = process.env.nextImageExportOptimizer_storePicturesInWEBP != undefined
        ? process.env.nextImageExportOptimizer_storePicturesInWEBP
        : true;
    if (!["JPG", "JPEG", "WEBP", "PNG", "AVIF"].includes(extension.toUpperCase())) {
        // The images has an unsupported extension
        // We will return the src
        return src;
    }
    // If the images are stored as WEBP by the package, then we should change
    // the extension to WEBP to load them correctly
    let processedExtension = extension;
    if (useWebp && ["JPG", "JPEG", "PNG"].includes(extension.toUpperCase())) {
        processedExtension = "WEBP";
    }
    let correctedPath = path;
    const lastChar = correctedPath?.substr(-1); // Selects the last character
    if (lastChar != "/") {
        // If the last character is not a slash
        correctedPath = correctedPath + "/"; // Append a slash to it.
    }
    const isStaticImage = src.includes("_next/static/media");
    const exportFolderName = process.env.nextImageExportOptimizer_exportFolderName ||
        "nextImageExportOptimizer";
    let generatedImageURL = `${isStaticImage ? "" : correctedPath}${exportFolderName}/${filename}-opt-${width}.${processedExtension.toUpperCase()}`;
    // if the generatedImageURL is not starting with a slash, then we add one
    if (generatedImageURL.charAt(0) !== "/") {
        generatedImageURL = "/" + generatedImageURL;
    }
    return generatedImageURL;
};
const optimizedLoader = ({ src, width, }) => {
    const isStaticImage = typeof src === "object";
    const _src = isStaticImage ? src.src : src;
    return generateImageURL(_src, width);
};
const fallbackLoader = ({ src }) => {
    let _src = typeof src === "object" ? src.src : src;
    // if the _src does not start with a slash, then we add one
    if (_src.charAt(0) !== "/") {
        _src = "/" + _src;
    }
    return _src;
};
function ExportedImage({ src, priority = false, loading, className, width, height, onLoadingComplete, unoptimized, placeholder = "blur", blurDataURL, style, onError, ...rest }) {
    const [imageError, setImageError] = useState(false);
    const automaticallyCalculatedBlurDataURL = useMemo(() => {
        if (blurDataURL) {
            // use the user provided blurDataURL if present
            return blurDataURL;
        }
        // check if the src is specified as a local file -> then it is an object
        const isStaticImage = typeof src === "object";
        const _src = isStaticImage ? src.src : src;
        if (unoptimized === true) {
            // return the src image when unoptimized
            return _src;
        }
        // otherwise use the generated image of 10px width as a blurDataURL
        return generateImageURL(_src, 10);
    }, [blurDataURL, src, unoptimized]);
    // check if the src is a SVG image -> then we should not use the blurDataURL and use unoptimized
    const isSVG = typeof src === "object" ? src.src.endsWith(".svg") : src.endsWith(".svg");
    const [blurComplete, setBlurComplete] = useState(false);
    // Currently, we have to handle the blurDataURL ourselves as the new Image component
    // is expecting a base64 encoded string, but the generated blurDataURL is a normal URL
    const blurStyle = placeholder === "blur" &&
        !isSVG &&
        automaticallyCalculatedBlurDataURL &&
        automaticallyCalculatedBlurDataURL.startsWith("/") &&
        !blurComplete
        ? {
            backgroundSize: style?.objectFit || "cover",
            backgroundPosition: style?.objectPosition || "50% 50%",
            backgroundRepeat: "no-repeat",
            backgroundImage: `url(${automaticallyCalculatedBlurDataURL})`,
            filter: "url(#sharpBlur)",
        }
        : undefined;
    const ImageElement = (React.createElement(Image, { ...rest, ...(width && { width }), ...(height && { height }), ...(loading && { loading }), ...(className && { className }), ...(onLoadingComplete && { onLoadingComplete }), ...(placeholder && {
            placeholder: blurStyle || blurComplete ? "empty" : placeholder,
        }), ...(unoptimized && { unoptimized }), ...(priority && { priority }), ...(isSVG && { unoptimized: true }), style: { ...style, ...blurStyle }, loader: imageError || unoptimized === true
            ? fallbackLoader
            : (e) => optimizedLoader({ src, width: e.width }), blurDataURL: automaticallyCalculatedBlurDataURL, onError: (error) => {
            setImageError(true);
            setBlurComplete(true);
            // execute the onError function if provided
            onError && onError(error);
        }, onLoadingComplete: (result) => {
            // for some configurations, the onError handler is not called on an error occurrence
            // so we need to check if the image is loaded correctly
            if (false && result.naturalWidth === 0) {
                // Broken image, fall back to unoptimized (meaning the original image src)
                setImageError(true);
            }
            setBlurComplete(true);
            // execute the onLoadingComplete callback if present
            onLoadingComplete && onLoadingComplete(result);
        }, src: src }));
    // When we present a placeholder, we add a svg filter to the image and remove it after either
    // the image is loaded or an error occurred
    return blurStyle ? (React.createElement(React.Fragment, null,
        React.createElement("noscript", null,
            React.createElement(Image, { ...rest, ...(width && { width }), ...(height && { height }), ...(loading && { loading }), ...(className && { className }), placeholder: "empty", ...(unoptimized && { unoptimized }), ...(priority && { priority }), style: style, loader: imageError || unoptimized === true
                    ? fallbackLoader
                    : (e) => optimizedLoader({ src, width: e.width }), src: src })),
        ImageElement,
        React.createElement("svg", { style: {
                border: 0,
                clip: "rect(0 0 0 0)",
                height: 0,
                margin: "-1px",
                overflow: "hidden",
                padding: 0,
                position: "absolute",
                width: "1px",
            } },
            React.createElement("filter", { id: "sharpBlur" },
                React.createElement("feGaussianBlur", { stdDeviation: "20", colorInterpolationFilters: "sRGB" }),
                React.createElement("feColorMatrix", { type: "matrix", colorInterpolationFilters: "sRGB", values: "1 0 0 0 0, 0 1 0 0 0, 0 0 1 0 0, 0 0 0 9 0" }),
                React.createElement("feComposite", { in2: "SourceGraphic", operator: "in" }))))) : (ImageElement);
}
export default ExportedImage;
