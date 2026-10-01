const express = require('express');
const Product = require('../models/product.model');
const router = express.Router();
const fields = ['pid', 'pname', 'price', 'quantity'];
const pickFields = (body) => Object.fromEntries(fields.filter((key) => body[key] !== undefined).map((key) => [key, body[key]]));

router.post('/', async (req, res) => {
  try {
    const data = pickFields(req.body || {});
    if (Object.keys(data).length !== fields.length) return res.status(400).json({ message: 'pid, pname, price, quantity are required' });
    const product = await Product.create(data);
    return res.status(201).json(product);
  } catch (error) {
    return res.status(error.code === 11000 ? 409 : 400).json({ message: error.code === 11000 ? 'pid already exists' : error.message });
  }
});

router.get('/', async (req, res) => {
  try { return res.json(await Product.find().sort({ createdAt: -1 })); }
  catch (error) { return res.status(500).json({ message: error.message }); }
});

router.get('/:pid', async (req, res) => {
  try {
    const product = await Product.findOne({ pid: req.params.pid });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    return res.json(product);
  } catch (error) { return res.status(500).json({ message: error.message }); }
});

router.put('/:pid', async (req, res) => {
  try {
    const data = pickFields(req.body || {});
    delete data.pid;
    if (!Object.keys(data).length) return res.status(400).json({ message: 'At least one editable field is required' });
    const product = await Product.findOneAndUpdate({ pid: req.params.pid }, { $set: data }, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    return res.json(product);
  } catch (error) { return res.status(error.code === 11000 ? 409 : 400).json({ message: error.message }); }
});

router.delete('/:pid', async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({ pid: req.params.pid });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    return res.json({ message: 'Product deleted successfully' });
  } catch (error) { return res.status(500).json({ message: error.message }); }
});
module.exports = router;
