import  UploadService  from './upload.service.js';

const uploadService = new UploadService();

class UploadController {
    async upload(req, res, next) {
        try {

            console.log("req.params.type------>",req.params.orderId,req.body,"file",req.file)
            const result = await uploadService.upload(
                `${req.params.orderId}`,
                req.file
            );
            res.json(result);
        } catch (e) {
            next(e);
        }
    }

    async download(req, res, next) {
        try {
            console.log("req.params.type------>",req.params.fileKey)
            const result = await uploadService.download(
                req.params.fileKey
            );
            res.send(result);
        } catch (e) {
            next(e);
        }
    }
}

export default UploadController;
