const route = require("express").Router()
const Bookmark = require("../models/Bookmark")
const userAuthModule = require("../module/userAuthModule")

// Add bookmark
route.post('/add', userAuthModule.verifyToken, async (req, res) => {
  try {
    const { productId, productName, productPrice, productEmoji, productCategory } = req.body
    const userId = req.userId

    // Check if bookmark already exists
    const existingBookmark = await Bookmark.findOne({ userId, productId })
    if (existingBookmark) {
      return res.status(400).json({ message: 'Product already bookmarked' })
    }

    const bookmark = new Bookmark({
      userId,
      productId,
      productName,
      productPrice,
      productEmoji,
      productCategory
    })

    await bookmark.save()
    res.status(201).json({ message: 'Product bookmarked successfully', bookmark })
  } catch (error) {
    console.error('Error adding bookmark:', error)
    res.status(500).json({ message: 'Failed to bookmark product', error: error.message })
  }
})

// Remove bookmark
route.delete('/remove/:productId', userAuthModule.verifyToken, async (req, res) => {
  try {
    const { productId } = req.params
    const userId = req.userId

    const result = await Bookmark.findOneAndDelete({ userId, productId })

    if (!result) {
      return res.status(404).json({ message: 'Bookmark not found' })
    }

    res.status(200).json({ message: 'Bookmark removed successfully' })
  } catch (error) {
    console.error('Error removing bookmark:', error)
    res.status(500).json({ message: 'Failed to remove bookmark', error: error.message })
  }
})

// Get all bookmarks for a user
route.get('/user/:userId', userAuthModule.verifyToken, async (req, res) => {
  try {
    const userId = req.userId

    const bookmarks = await Bookmark.find({ userId }).sort({ createdAt: -1 })

    res.status(200).json({ message: 'Bookmarks fetched successfully', bookmarks })
  } catch (error) {
    console.error('Error fetching bookmarks:', error)
    res.status(500).json({ message: 'Failed to fetch bookmarks', error: error.message })
  }
})

// Check if product is bookmarked
route.get('/check/:productId', userAuthModule.verifyToken, async (req, res) => {
  try {
    const { productId } = req.params
    const userId = req.userId

    const bookmark = await Bookmark.findOne({ userId, productId })

    res.status(200).json({ isBookmarked: !!bookmark })
  } catch (error) {
    console.error('Error checking bookmark:', error)
    res.status(500).json({ message: 'Failed to check bookmark', error: error.message })
  }
})

module.exports = route
