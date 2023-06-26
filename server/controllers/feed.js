
exports.getPosts = (req, res, next) => {
  return res.status(200).json({
    message: 'Success!',
    posts: [{
      _id: 1,
      title: 'First post',
      content: '',
      creator: { name: 'Arkadii' },
      createdAt: new Date()
    }]
  })
}