const Product = require('../models/Product');
const { DEFAULT_PRODUCTS } = require('../config/defaultProducts');

// Get all products
exports.getProducts = async (req, res) => {
  try {
    const { category, active = 'true' } = req.query;
    
    const query = {};
    if (category) {
      query.category = category;
    }
    if (active === 'true') {
      query.isActive = true;
    }
    
    let products = await Product.find(query).sort({ category: 1, name: 1 });
    
    // If no products in database, initialize from static catalog
    if (products.length === 0) {
      await exports.initializeProducts();
      products = await Product.find(query).sort({ category: 1, name: 1 });
    }
    
    res.json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch products'
    });
  }
};

// Get single product
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findOne({ productId: req.params.id });
    
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }
    
    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch product'
    });
  }
};

// Update product price (admin only)
exports.updateProductPrice = async (req, res) => {
  try {
    const { basePrice, options } = req.body;
    const { id } = req.params;
    
    const updateData = {
      updatedAt: Date.now(),
      updatedBy: req.user ? req.user.username || req.user.email : 'system'
    };
    
    if (typeof basePrice === 'number') {
      updateData.basePrice = basePrice;
    }
    
    if (options) {
      updateData.options = options;
    }
    
    const product = await Product.findOneAndUpdate(
      { productId: id },
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Product price updated successfully',
      data: product
    });
  } catch (error) {
    console.error('Error updating product price:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update product price'
    });
  }
};

// Update entire product (admin only)
exports.updateProduct = async (req, res) => {
  try {
    const { name, category, basePrice, hasOptions, options, isActive } = req.body;
    const { id } = req.params;
    
    const updateData = {
      updatedAt: Date.now(),
      updatedBy: req.user ? req.user.username || req.user.email : 'system'
    };
    
    if (name) updateData.name = name;
    if (category) updateData.category = category;
    if (typeof basePrice === 'number') updateData.basePrice = basePrice;
    if (typeof hasOptions === 'boolean') updateData.hasOptions = hasOptions;
    if (options !== undefined) updateData.options = options;
    if (typeof isActive === 'boolean') updateData.isActive = isActive;
    
    const product = await Product.findOneAndUpdate(
      { productId: id },
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update product'
    });
  }
};

// Create new product (admin only)
exports.createProduct = async (req, res) => {
  try {
    const { productId, name, category, basePrice, hasOptions, options } = req.body;
    
    // Check if product already exists
    const existingProduct = await Product.findOne({ productId });
    if (existingProduct) {
      return res.status(400).json({
        success: false,
        error: 'Product with this ID already exists'
      });
    }
    
    const product = new Product({
      productId,
      name,
      category,
      basePrice,
      hasOptions: hasOptions || false,
      options: options || null,
      updatedBy: req.user ? req.user.username || req.user.email : 'system'
    });
    
    await product.save();
    
    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create product'
    });
  }
};

// Delete product (admin only)
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({ productId: req.params.id });
    
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Product deleted successfully',
      data: {}
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete product'
    });
  }
};

// Initialize products from static catalog (internal use)
exports.initializeProducts = async () => {
  try {
    const existingCount = await Product.countDocuments();
    
    if (existingCount === 0) {
      console.log('Initializing products from static catalog...');
      
      const productsToInsert = DEFAULT_PRODUCTS.map(product => ({
        productId: product.id,
        name: product.name,
        category: product.category,
        basePrice: product.basePrice,
        hasOptions: product.hasOptions || false,
        options: product.options || null,
        isActive: true,
        updatedBy: 'system'
      }));
      
      await Product.insertMany(productsToInsert);
      console.log(`✅ Initialized ${productsToInsert.length} products from catalog`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error initializing products:', error);
    throw error;
  }
};

// Bulk update prices (admin only)
exports.bulkUpdatePrices = async (req, res) => {
  try {
    const { updates } = req.body; // Array of { productId, basePrice }
    
    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Please provide an array of price updates'
      });
    }
    
    const results = [];
    const updatedBy = req.user ? req.user.username || req.user.email : 'system';
    
    for (const update of updates) {
      if (!update.productId || typeof update.basePrice !== 'number') {
        results.push({
          productId: update.productId,
          success: false,
          error: 'Invalid data'
        });
        continue;
      }
      
      const product = await Product.findOneAndUpdate(
        { productId: update.productId },
        { 
          basePrice: update.basePrice, 
          updatedAt: Date.now(),
          updatedBy 
        },
        { new: true }
      );
      
      results.push({
        productId: update.productId,
        success: !!product,
        newPrice: product ? product.basePrice : null
      });
    }
    
    res.json({
      success: true,
      message: 'Bulk price update completed',
      data: results
    });
  } catch (error) {
    console.error('Error in bulk price update:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update prices'
    });
  }
};

// Reset products to default prices (admin only)
exports.resetToDefaults = async (req, res) => {
  try {
    const updatedBy = req.user ? req.user.username || req.user.email : 'system';
    
    for (const product of DEFAULT_PRODUCTS) {
      await Product.findOneAndUpdate(
        { productId: product.id },
        {
          basePrice: product.basePrice,
          options: product.options || null,
          updatedAt: Date.now(),
          updatedBy
        },
        { upsert: true }
      );
    }
    
    res.json({
      success: true,
      message: 'All products reset to default prices'
    });
  } catch (error) {
    console.error('Error resetting products:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset products'
    });
  }
};
