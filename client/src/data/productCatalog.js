// Laundry Product Catalog with Categories and Pricing

export const PRODUCT_CATEGORIES = [
  {
    id: 'combination',
    name: 'Combination',
    color: '#FFE5B4',
    icon: '🎁'
  },
  {
    id: 'household',
    name: 'Household',
    color: '#B4D7FF',
    icon: '🏠'
  },
  {
    id: 'upper_body',
    name: 'Upper Body',
    color: '#C5FFB4',
    icon: '👕'
  },
  {
    id: 'lower_body',
    name: 'Lower Body',
    color: '#FFD4B4',
    icon: '👖'
  },
  {
    id: 'others',
    name: 'Others',
    color: '#B4FFFF',
    icon: '🧺'
  }
];

export const PRODUCTS = [
  // Combination
  {
    id: 'prepaid_discount',
    name: 'Prepaid Discount',
    category: 'combination',
    basePrice: -10.00,
    hasOptions: false
  },
  
  // Household Items
  {
    id: 'curtain',
    name: 'Curtain',
    category: 'household',
    basePrice: 50.00,
    hasOptions: false
  },
  {
    id: 'quilt',
    name: 'Quilt',
    category: 'household',
    basePrice: 150.00,
    hasOptions: false
  },
  {
    id: 'bedsheet',
    name: 'Bedsheet',
    category: 'household',
    basePrice: 80.00,
    hasOptions: false
  },
  {
    id: 'blanket',
    name: 'Blanket',
    category: 'household',
    basePrice: 120.00,
    hasOptions: false
  },
  {
    id: 'bed_cover',
    name: 'Bed cover',
    category: 'household',
    basePrice: 100.00,
    hasOptions: false
  },
  {
    id: 'pillow_cover',
    name: 'Pillow cover/Cuison cover',
    category: 'household',
    basePrice: 30.00,
    hasOptions: false
  },
  {
    id: 'carpet_per_sqft',
    name: 'Carpet per sq ft',
    category: 'household',
    basePrice: 29.00,
    hasOptions: false
  },
  {
    id: 'duvet_cover',
    name: 'Duvet Cover',
    category: 'household',
    basePrice: 90.00,
    hasOptions: false
  },
  {
    id: 'bath_towel',
    name: 'Bath Towel',
    category: 'household',
    basePrice: 40.00,
    hasOptions: false
  },
  {
    id: 'hand_towel',
    name: 'Hand Towel',
    category: 'household',
    basePrice: 25.00,
    hasOptions: false
  },
  {
    id: 'car_towel',
    name: 'Car Towel',
    category: 'household',
    basePrice: 39.00,
    hasOptions: false
  },
  {
    id: 'tablecloth',
    name: 'Tablecloth',
    category: 'household',
    basePrice: 60.00,
    hasOptions: false
  },
  {
    id: 'runner',
    name: 'Runner',
    category: 'household',
    basePrice: 45.00,
    hasOptions: false
  },
  
  // Upper Body
  {
    id: 'shirt',
    name: 'Shirt',
    category: 'upper_body',
    basePrice: 149.00,
    hasOptions: true,
    options: {
      gender: [
        { value: 'male', label: 'Male', price: 10.00 },
        { value: 'female', label: 'Female', price: 10.00 },
        { value: 'kids', label: 'Kids', price: 0 },
        { value: 'iron', label: 'Iron', price: 14.00 }
      ],
      color: [
        { value: 'white', label: 'White', price: 10.00 },
        { value: 'other', label: 'Other', price: 0 }
      ],
      type: [
        { value: 'sweatshirt', label: 'Sweatshirt', price: 110.00 },
        { value: 'tshirt', label: 'T-shirt', price: 0 },
        { value: 'fullsleeves', label: 'Full Sleeves', price: 0 }
      ]
    }
  },
  {
    id: 'blouse',
    name: 'Blouse',
    category: 'upper_body',
    basePrice: 80.00,
    hasOptions: false
  },
  {
    id: 'jacket',
    name: 'Jacket',
    category: 'upper_body',
    basePrice: 200.00,
    hasOptions: false
  },
  {
    id: 'blazer_coat',
    name: 'Blazer/Coat',
    category: 'upper_body',
    basePrice: 250.00,
    hasOptions: false
  },
  {
    id: 'sweater_cardigan',
    name: 'Sweater/Cardigan',
    category: 'upper_body',
    basePrice: 150.00,
    hasOptions: false
  },
  {
    id: 'shawl',
    name: 'Shawl',
    category: 'upper_body',
    basePrice: 120.00,
    hasOptions: false
  },
  
  // Lower Body
  {
    id: 'pant',
    name: 'Pant',
    category: 'lower_body',
    basePrice: 120.00,
    hasOptions: false
  },
  {
    id: 'jeans',
    name: 'Jeans',
    category: 'lower_body',
    basePrice: 130.00,
    hasOptions: false
  },
  {
    id: 'skirt',
    name: 'Skirt',
    category: 'lower_body',
    basePrice: 100.00,
    hasOptions: false
  },
  {
    id: 'tie',
    name: 'Tie',
    category: 'lower_body',
    basePrice: 50.00,
    hasOptions: false
  },
  {
    id: 'stole_scarf',
    name: 'Stole/Scarf',
    category: 'lower_body',
    basePrice: 60.00,
    hasOptions: false
  },
  
  // Others
  {
    id: 'saree',
    name: 'Saree',
    category: 'others',
    basePrice: 180.00,
    hasOptions: false
  },
  {
    id: 'salwar_suit',
    name: 'Salwar/suit',
    category: 'others',
    basePrice: 200.00,
    hasOptions: false
  },
  {
    id: 'kurta',
    name: 'Kurta',
    category: 'others',
    basePrice: 140.00,
    hasOptions: false
  },
  {
    id: 'kurti',
    name: 'Kurti',
    category: 'others',
    basePrice: 130.00,
    hasOptions: false
  },
  {
    id: 'dress_fancy',
    name: 'Dress Fancy(kids)',
    category: 'others',
    basePrice: 150.00,
    hasOptions: false
  },
  {
    id: 'kids_suit_set',
    name: 'Kids Suit Set',
    category: 'others',
    basePrice: 120.00,
    hasOptions: false
  },
  {
    id: 'jump_suit',
    name: 'Jump Suit',
    category: 'others',
    basePrice: 180.00,
    hasOptions: false
  },
  {
    id: 'nighty',
    name: 'Nighty',
    category: 'others',
    basePrice: 80.00,
    hasOptions: false
  },
  {
    id: 'pyjama',
    name: 'Pyjama',
    category: 'others',
    basePrice: 90.00,
    hasOptions: false
  },
  {
    id: 'track_suit',
    name: 'Track Suit',
    category: 'others',
    basePrice: 160.00,
    hasOptions: false
  },
  {
    id: 'long_gown_maxi',
    name: 'Long Gown/Maxi',
    category: 'others',
    basePrice: 170.00,
    hasOptions: false
  },
  {
    id: 'lehenga',
    name: 'Lehenga',
    category: 'others',
    basePrice: 300.00,
    hasOptions: false
  },
  {
    id: 'bag',
    name: 'Bag',
    category: 'others',
    basePrice: 250.00,
    hasOptions: false
  },
  {
    id: 'bandi',
    name: 'Bandi',
    category: 'others',
    basePrice: 100.00,
    hasOptions: false
  },
  {
    id: 'handkerchief',
    name: 'Handkerchief',
    category: 'others',
    basePrice: 20.00,
    hasOptions: false
  },
  {
    id: 'petticoat',
    name: 'Petticoat',
    category: 'others',
    basePrice: 70.00,
    hasOptions: false
  },
  {
    id: 'shoes',
    name: 'Shoes',
    category: 'others',
    basePrice: 180.00,
    hasOptions: false
  },
  {
    id: 'sherwani',
    name: 'Sherwani',
    category: 'others',
    basePrice: 350.00,
    hasOptions: false
  },
  {
    id: 'silk_salwar_kameez',
    name: 'Silk Salwar Kameez(kids)',
    category: 'others',
    basePrice: 220.00,
    hasOptions: false
  },
  {
    id: 'sofa_cover',
    name: 'Sofa cover(per seat)',
    category: 'others',
    basePrice: 120.00,
    hasOptions: false
  },
  {
    id: 'suit_3pc',
    name: 'Suit 3pc',
    category: 'others',
    basePrice: 450.00,
    hasOptions: false
  },
  {
    id: 'suit_pc',
    name: 'Suit pc',
    category: 'others',
    basePrice: 200.00,
    hasOptions: false
  },
  {
    id: 'top',
    name: 'TOP',
    category: 'others',
    basePrice: 90.00,
    hasOptions: false
  },
  {
    id: 'top_up_ewallet',
    name: 'Top-up eWallet',
    category: 'others',
    basePrice: 0,
    hasOptions: false
  },
  {
    id: 'dupatta_set',
    name: 'Salwar, pyjama, Dupatta Set',
    category: 'others',
    basePrice: 160.00,
    hasOptions: false
  },
  {
    id: 'frock_dress',
    name: 'Frock/Dress(kids)',
    category: 'others',
    basePrice: 110.00,
    hasOptions: false
  },
  {
    id: 'gloves_ug',
    name: 'Socks/Gloves/UG',
    category: 'others',
    basePrice: 30.00,
    hasOptions: false
  },
  {
    id: 'western_1piece',
    name: 'Westerns/One Piece',
    category: 'others',
    basePrice: 180.00,
    hasOptions: false
  },
  {
    id: 'safari',
    name: 'Safari',
    category: 'others',
    basePrice: 150.00,
    hasOptions: false
  },
  {
    id: 'salwar_kameez_kids',
    name: 'Salwar Kameez(kids)',
    category: 'others',
    basePrice: 140.00,
    hasOptions: false
  },
  {
    id: 'seasonal_offer',
    name: 'Seasonal Offer',
    category: 'others',
    basePrice: 0,
    hasOptions: false
  },
  {
    id: 'mate',
    name: 'Mate',
    category: 'others',
    basePrice: 80.00,
    hasOptions: false
  },
  {
    id: 'kurti_set_iron',
    name: 'Kurti set Iron',
    category: 'others',
    basePrice: 140.00,
    hasOptions: false
  },
  {
    id: 'same_day_delivery',
    name: 'Same day delivery',
    category: 'others',
    basePrice: 50.00,
    hasOptions: false
  },
  {
    id: 'due_amount',
    name: 'Due amount',
    category: 'others',
    basePrice: 0,
    hasOptions: false
  },
  {
    id: 'ganji',
    name: 'Ganji',
    category: 'others',
    basePrice: 60.00,
    hasOptions: false
  }
];

export const getProductsByCategory = (categoryId) => {
  return PRODUCTS.filter(product => product.category === categoryId);
};

export const getProductById = (productId) => {
  return PRODUCTS.find(product => product.id === productId);
};

export const calculateItemPrice = (product, selectedOptions = {}) => {
  let total = product.basePrice;
  
  if (product.hasOptions && selectedOptions) {
    Object.keys(selectedOptions).forEach(optionType => {
      const selectedValue = selectedOptions[optionType];
      const option = product.options[optionType]?.find(opt => opt.value === selectedValue);
      if (option) {
        total += option.price;
      }
    });
  }
  
  return total;
};

