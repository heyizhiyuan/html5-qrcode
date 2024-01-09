/**
 * @fileoverview
 * {@interface QrcodeDecoder} wrapper around ZXing library.
 * 
 * @author mebjas <minhazav@gmail.com>
 * 
 * ZXing library forked from https://github.com/zxing-js/library.
 * 
 * The word "QR Code" is registered trademark of DENSO WAVE INCORPORATED
 * http://www.denso-wave.com/qrcode/faqpatent-e.html
 */

import * as ZXing from "../third_party/zxing-js.umd";
import '../third_party/opencv';

import {
    QrcodeResult,
    QrcodeResultDebugData,
    QrcodeResultFormat,
    Html5QrcodeSupportedFormats,
    Logger,
    QrcodeDecoderAsync,
    OpenCvConfig
} from "./core";

const detectProto = "detect.prototxt";

const detectWeight = "detect.caffemodel";

const srProto = "sr.prototxt";

const srWeight = "sr.caffemodel";

const loadScript = (url: string) => {
    return new Promise((resolve, reject) => {
        let script = document.createElement("script");
        script.setAttribute("async", "");
        script.setAttribute("type", "text/javascript");
        script.setAttribute("id", "opencvjs");
        script.addEventListener("load", async () => {
            if (window.cv.getBuildInformation) {
                resolve(window.cv);
            } else {
                // WASM
                if (window.cv instanceof Promise) {
                    window.cv = await window.cv;
                    resolve(window.cv);
                } else {
                    window.cv["onRuntimeInitialized"] = () => {
                        resolve(window.cv);
                    };
                }
            }
        });
        script.addEventListener("error", () => {
            reject();
        });
        script.src = url;
        const node = document.getElementsByTagName("script")[0];
        //@ts-ignore
        node.parentNode.insertBefore(script, node);
    });
}

/**
 * Request QR code training model file
 */
const fetchModelsData = async function (addr: string, name: string): Promise<Uint8Array> {
    //`https://static.xxxx.com/common/opencv/models/${name}`
    const response = await fetch(`${addr}/${name}`, {
        method: "GET",
    });
    return new Uint8Array(await response.arrayBuffer());
};

/**
 * OpenCv based Code decoder.
 */
export class OpenCvHtml5QrcodeDecoder implements QrcodeDecoderAsync {

    private verbose: boolean;
    private logger: Logger;
    private qrcodeDetector: any;

    public constructor(
        requestedFormats: Array<Html5QrcodeSupportedFormats>,
        verbose: boolean,
        logger: Logger) {
        this.verbose = verbose;
        this.logger = logger;
        this.validateOpenCvFormats(requestedFormats);
        this.qrcodeDetector = new window.cv.wechat_qrcode_WeChatQRCode(
            detectProto,
            detectWeight,
            srProto,
            srWeight
        );
    }

    /**
     * 
     */
    public static async init(config: OpenCvConfig): Promise<void> {
        //loadScript(config.modelAddr);

        const dp = await fetchModelsData(config.modelAddr, detectProto);
        const dw = await fetchModelsData(config.modelAddr, detectWeight);
        const sp = await fetchModelsData(config.modelAddr, srProto);
        const sw = await fetchModelsData(config.modelAddr, srWeight);

        window.cv.FS_createDataFile("/", detectProto, dp, true, false, false);
        window.cv.FS_createDataFile("/", detectWeight, dw, true, false, false);
        window.cv.FS_createDataFile("/", srProto, sp, true, false, false);
        window.cv.FS_createDataFile("/", srWeight, sw, true, false, false);
    }

    private validateOpenCvFormats(
        requestedFormats: Array<Html5QrcodeSupportedFormats>) {
        for (const requestedFormat of requestedFormats) {
            if (Html5QrcodeSupportedFormats.QR_CODE !== requestedFormat) {
                throw Error(`${requestedFormat} is not supported by`
                    + "OpenCvHtml5QrcodeShim");
            }
        }
    }

    decodeAsync(canvas: HTMLCanvasElement): Promise<QrcodeResult> {
        return new Promise((resolve, reject) => {
            try {
                const inputImage = window.cv.imread(canvas, window.cv.IMREAD_GRAYSCALE);
                const pointsVec = new window.cv.MatVector();
                const res = this.qrcodeDetector.detectAndDecode(inputImage, pointsVec);
                const text = res.get(0);
                if (text) {
                    return resolve({
                        text,
                        format: QrcodeResultFormat.create(Html5QrcodeSupportedFormats.QR_CODE),
                        debugData: this.createDebugData()
                    });
                }
                reject();
            } catch (error) {
                reject(error);
            }
        });
    }

    private createDebugData(): QrcodeResultDebugData {
        return { decoderName: "opencv-js" };
    }

}
