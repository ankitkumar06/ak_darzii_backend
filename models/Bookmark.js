const mongoose = require('mongoose')

const BookmarkSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    productId: {
      type: String,
      required: true
    },
    productName: {
      type: String
    },
    productPrice: {
      type: Number
    },
    productEmoji: {
      type: String
    },
    productCategory: {
      type: String
    }
  },
  {
    timestamps: true
  }
)

// Create a unique index to prevent duplicate bookmarks for the same user and product
BookmarkSchema.index({ userId: 1, productId: 1 }, { unique: true })

const Bookmark = mongoose.model('Bookmark', BookmarkSchema)

module.exports = Bookmark
