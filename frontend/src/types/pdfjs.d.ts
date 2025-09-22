declare module 'pdfjs-dist/build/pdf.worker.min.mjs?url' {
    const workerSrc: string;
    export default workerSrc;
}

declare module 'pdfjs-dist/webpack.mjs' {
    export * from 'pdfjs-dist';
}
