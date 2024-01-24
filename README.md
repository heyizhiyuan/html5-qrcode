# Html5-QRCode-Cv

## Scanning only QR code with `Html5Qrcode`

```jsx
export default function QrScanner() {

  useEffect(() => {
    const html5QrCode = new Html5Qrcode(
      "reader", {
      formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
      opencv: {
        modelAddr: "https://raw.githubusercontent.com/WeChatCV/opencv_3rdparty/wechat_qrcode"
      }
    }
    );
    const qrCodeSuccessCallback = (decodedText, decodedResult) => {
      /* handle success */
      console.log("decodedText:", decodedText);
    };
    const config = { fps: 10, qrbox: { width: 250, height: 250 } };

    // If you want to prefer back camera
    html5QrCode.start({ facingMode: "environment" }, config, qrCodeSuccessCallback);
    return () => {
      html5QrCode.stop();
    }
  }, [])



  return (
    <div>
      <div id='reader'></div>
    </div>
  );
}
```
