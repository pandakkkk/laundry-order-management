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
  },
  {
    id: 'b2b_business',
    name: 'B2B Business',
    color: '#E5B4FF',
    icon: '🏢'
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
  },

  // B2B Business - Event/General Items (from price quotation)
  { id: 'b2b_plain_parda', name: 'Plain Parda', category: 'b2b_business', basePrice: 60.00, hasOptions: false },
  { id: 'b2b_net_parda', name: 'Net Parda', category: 'b2b_business', basePrice: 70.00, hasOptions: false },
  { id: 'b2b_ceiling_parda', name: 'Ceiling Parda', category: 'b2b_business', basePrice: 250.00, hasOptions: false },
  { id: 'b2b_jhalar', name: 'Jhalar', category: 'b2b_business', basePrice: 20.00, hasOptions: false },
  { id: 'b2b_table_cover', name: 'Table cover', category: 'b2b_business', basePrice: 25.00, hasOptions: false },
  { id: 'b2b_chair_cover', name: 'Chair cover', category: 'b2b_business', basePrice: 11.00, hasOptions: false },
  { id: 'b2b_round_table_cover', name: 'Round Table Cover', category: 'b2b_business', basePrice: 25.00, hasOptions: false },
  { id: 'b2b_table_cloth', name: 'Table Cloth', category: 'b2b_business', basePrice: 15.00, hasOptions: false },
  { id: 'b2b_napkin', name: 'Napkin', category: 'b2b_business', basePrice: 15.00, hasOptions: false },
  { id: 'b2b_bedsheet', name: 'Bedsheet', category: 'b2b_business', basePrice: 25.00, hasOptions: false },
  { id: 'b2b_pillow_cover', name: 'Pillow Cover', category: 'b2b_business', basePrice: 10.00, hasOptions: false },
  { id: 'b2b_than', name: 'Than', category: 'b2b_business', basePrice: 60.00, hasOptions: false },
  { id: 'b2b_white_towel', name: 'White Towel', category: 'b2b_business', basePrice: 20.00, hasOptions: false },
  { id: 'b2b_sofa_cover', name: 'Sofa Cover', category: 'b2b_business', basePrice: 30.00, hasOptions: false },
  { id: 'b2b_zajim', name: 'Zajim', category: 'b2b_business', basePrice: 30.00, hasOptions: false },
  { id: 'b2b_darii', name: 'Darii (per KG)', category: 'b2b_business', basePrice: 15.00, hasOptions: false },

  // B2B Business - Hotel Linen
  { id: 'b2b_bed_sheet_single', name: 'Bed sheet Single', category: 'b2b_business', basePrice: 20.00, hasOptions: false },
  { id: 'b2b_bed_sheet_double', name: 'Bed sheet double', category: 'b2b_business', basePrice: 25.00, hasOptions: false },
  { id: 'b2b_duvet_cover_double', name: 'Duvet Cover Double', category: 'b2b_business', basePrice: 30.00, hasOptions: false },
  { id: 'b2b_duvet_cover_single', name: 'Duvet Cover Single', category: 'b2b_business', basePrice: 25.00, hasOptions: false },
  { id: 'b2b_mattress_protractor_s', name: 'Mattress protractor (S)', category: 'b2b_business', basePrice: 45.00, hasOptions: false },
  { id: 'b2b_mattress_protractor_d', name: 'Mattress protractor (D)', category: 'b2b_business', basePrice: 65.00, hasOptions: false },
  { id: 'b2b_pillow_cover_hotel', name: 'Pillow Cover (Hotel)', category: 'b2b_business', basePrice: 10.00, hasOptions: false },
  { id: 'b2b_cushion_cover', name: 'Cushion Cover', category: 'b2b_business', basePrice: 8.00, hasOptions: false },
  { id: 'b2b_hand_towel_hotel', name: 'Hand Towel (Hotel)', category: 'b2b_business', basePrice: 8.00, hasOptions: false },
  { id: 'b2b_bath_towel_hotel', name: 'Bath Towel (Hotel)', category: 'b2b_business', basePrice: 15.00, hasOptions: false },
  { id: 'b2b_bed_runner', name: 'Bed Runner', category: 'b2b_business', basePrice: 10.00, hasOptions: false },
  { id: 'b2b_door_mat', name: 'Door Mat', category: 'b2b_business', basePrice: 18.00, hasOptions: false },
  { id: 'b2b_bathmat', name: 'Bathmat', category: 'b2b_business', basePrice: 15.00, hasOptions: false },
  { id: 'b2b_curtain_normal', name: 'Curtain (Normal Washing)', category: 'b2b_business', basePrice: 20.00, hasOptions: false },
  { id: 'b2b_window_curtain', name: 'Window Curtain', category: 'b2b_business', basePrice: 65.00, hasOptions: false },
  { id: 'b2b_door_curtain', name: 'Door curtain', category: 'b2b_business', basePrice: 85.00, hasOptions: false },
  { id: 'b2b_blanket_single_hotel', name: 'Blanket Single (Hotel)', category: 'b2b_business', basePrice: 7.00, hasOptions: false },
  { id: 'b2b_blanket_double_hotel', name: 'Blanket double (Hotel)', category: 'b2b_business', basePrice: 10.00, hasOptions: false },
  { id: 'b2b_white_napkin', name: 'White Napkin', category: 'b2b_business', basePrice: 10.00, hasOptions: false },
  { id: 'b2b_table_mat', name: 'Table Mat', category: 'b2b_business', basePrice: 55.00, hasOptions: false },
  { id: 'b2b_tablecloth_top', name: 'Tablecloth & Top', category: 'b2b_business', basePrice: 40.00, hasOptions: false },
  { id: 'b2b_waist_coat', name: 'Waist Coat (Dry Cleaning)', category: 'b2b_business', basePrice: 40.00, hasOptions: false },
  { id: 'b2b_capt_coat', name: 'Capt. Coat (Drycleaning)', category: 'b2b_business', basePrice: 40.00, hasOptions: false },
  { id: 'b2b_apron_hotel', name: 'Apron (Hotel)', category: 'b2b_business', basePrice: 100.00, hasOptions: false },
  { id: 'b2b_tie_dry_cleaning', name: 'Tie (Dry Cleaning)', category: 'b2b_business', basePrice: 10.00, hasOptions: false },
  { id: 'b2b_saree_hotel', name: 'Saree (Hotel)', category: 'b2b_business', basePrice: 100.00, hasOptions: false },

  // B2B Business - Spa and Salon
  { id: 'b2b_big_towel', name: 'Big Towel (Spa)', category: 'b2b_business', basePrice: 10.00, hasOptions: false },
  { id: 'b2b_small_towel', name: 'Small Towel (Spa)', category: 'b2b_business', basePrice: 8.00, hasOptions: false },
  { id: 'b2b_apron_spa', name: 'Apron (Spa)', category: 'b2b_business', basePrice: 10.00, hasOptions: false },
  { id: 'b2b_single_bedsheet_spa', name: 'Single Bedsheet (Spa)', category: 'b2b_business', basePrice: 10.00, hasOptions: false },
  { id: 'b2b_pillow_cover_spa', name: 'Pillow Cover (Spa)', category: 'b2b_business', basePrice: 8.00, hasOptions: false },
  { id: 'b2b_window_curtain_spa', name: 'Window Curtain (Spa)', category: 'b2b_business', basePrice: 15.00, hasOptions: false }
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

