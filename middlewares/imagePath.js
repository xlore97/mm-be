function setImagePath(req, res, next) {
    req.imagePath = `${req.protocol}://${req.get('host')}/img/`;
    console.log('imagePath:', req.imagePath); // TEST
    next()
}

module.exports = setImagePath;
