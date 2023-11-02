var express = require('express');
var router = express.Router();
const fs = require('fs');
var path = require('path');
const AWS = require("aws-sdk");
const s3 = new AWS.S3()

/* GET pictures listing. */
router.get('/', async function(req, res, next) {
    var params = {
        Bucket: process.env.CYCLIC_BUCKET_NAME,
        Delimiter: '/',
        Prefix: 'public/'
    };
    var allObjects = await s3.listObjects(params).promise();
    var keys = allObjects?.Contents.map( x=> x.Key);
    const pictures = await Promise.all(keys.map(async (key) => {
        let my_file = await s3.getObject({
            Bucket: process.env.CYCLIC_BUCKET_NAME,
            Key: key,
        }).promise();
        return {
            src: Buffer.from(my_file.Body).toString('base64'),
            name: key.split("/").pop()
        }
    }))
    //const pictures = fs.readdirSync(path.join(__dirname, '../pictures/'));
    res.render('pictures', { pictures: pictures});
});

router.get('/:pictureName', function(req, res, next) {
    res.render('pictureDetails', { picture: req.params.pictureName});
});    

// saving locally
/*router.post('/', function(req, res, next) {
    const file = req.files.file;
    fs.writeFileSync(path.join(__dirname, '../pictures/', file.name), file.data);
    res.end();
});*/

//saving on S3
router.post('/', async function(req, res, next) {
    const file = req.files.file;
    console.log(req.files);
    await s3.putObject({
        Body: file.data,
        Bucket: process.env.CYCLIC_BUCKET_NAME,
        Key: "public/" + file.name,
    }).promise()
    res.end();
});

module.exports = router;