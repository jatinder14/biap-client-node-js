import {getSignedUrlForUpload,downloadResourceFromS3} from '../../utils/s3Utils.js';
class UploadService {
    async upload(path, fileType) {
        console.log("path---->",path);
        console.log("path--filetype-->",fileType);

            return await getSignedUrlForUpload({ path, fileType });
    }

    async download(fileKey) {
            return await downloadResourceFromS3(fileKey);
    }

}
export default UploadService;
