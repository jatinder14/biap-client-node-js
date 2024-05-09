import getSignedUrlForUpload from '../../utils/s3Utils.js';
class UploadService {
    async upload(path, fileType) {
        console.log("path---->",path);
        console.log("path--filetype-->",fileType);

            // return await getSignedUrlForUpload({ path, fileType });
            let result = await getSignedUrlForUpload({ path, fileType });
        console.log('result22222',result)

            return result 
    }
}
export default UploadService;
