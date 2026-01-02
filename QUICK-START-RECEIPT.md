# 🚀 Quick Start - Receipt Generation Feature

## ✅ Application is Running!

Your application is now running with the new receipt generation feature.

---

## 🌐 Access Points

- **Frontend Dashboard:** http://localhost:3000
- **Backend API:** http://localhost:5000/api
- **Health Check:** http://localhost:5000/api/health

---

## 🧾 How to Test Receipt Generation

### Step 1: Login
1. Open http://localhost:3000 in your browser
2. Login with:
   - **Email:** `admin@laundry.com`
   - **Password:** `admin123`

### Step 2: Open an Order
1. Find any order in the dashboard
2. Click on the order (or click the eye icon 👁️)
3. Order details modal will open

### Step 3: Generate Receipt
1. In the order details modal, you'll see two new buttons:
   - **🧾 Download Receipt** - Downloads PDF to your computer
   - **🖨️ Print Receipt** - Opens print dialog

2. Click either button to generate the receipt

### Step 4: Verify Receipt
The PDF receipt should contain:
- ✅ Business information (header)
- ✅ Order details (ticket number, dates)
- ✅ Customer information
- ✅ Items list with prices
- ✅ Payment information
- ✅ QR code (for order tracking)
- ✅ Terms and conditions (footer)

---

## ⚙️ Customize Business Information

Before using in production, update your business details:

### Option 1: Edit Config File
Edit `server/config/business.js`:
```javascript
module.exports = {
  name: 'Your Laundry Service Name',
  address: 'Your Street Address',
  city: 'Your City',
  state: 'Your State',
  pincode: '123456',
  phone: '+91 98765 43210',
  email: 'info@yourlaundry.com',
  gstin: 'GSTIN123456789', // Optional
  // ... etc
};
```

### Option 2: Use Environment Variables
Add to `.env` file:
```env
BUSINESS_NAME="Your Laundry Service"
BUSINESS_ADDRESS="Your Address"
BUSINESS_CITY="Your City"
BUSINESS_STATE="Your State"
BUSINESS_PINCODE="123456"
BUSINESS_PHONE="+91 98765 43210"
BUSINESS_EMAIL="info@yourlaundry.com"
```

**Note:** After changing business config, restart the server:
```bash
# Stop server (Ctrl+C)
# Then restart:
npm run dev
```

---

## 🧪 Test Checklist

- [ ] Server is running (check http://localhost:5000/api/health)
- [ ] Frontend is running (check http://localhost:3000)
- [ ] Can login successfully
- [ ] Can view order details
- [ ] "Download Receipt" button appears
- [ ] "Print Receipt" button appears
- [ ] Can download receipt PDF
- [ ] PDF contains all order information
- [ ] QR code appears on receipt (if working)
- [ ] Business information is correct

---

## 🐛 Troubleshooting

### Receipt Not Generating?

1. **Check Server Logs**
   - Look at the terminal where `npm run dev` is running
   - Check for any error messages

2. **Verify Order Exists**
   - Make sure you're clicking on a valid order
   - Check if order has all required fields

3. **Check Browser Console**
   - Open browser DevTools (F12)
   - Check Console tab for errors
   - Check Network tab for failed requests

### PDF Not Downloading?

1. **Browser Settings**
   - Check if browser blocks downloads
   - Allow pop-ups for localhost:3000

2. **Check File Permissions**
   - Make sure you have write permissions in Downloads folder

### QR Code Not Showing?

- QR code might fail silently
- Receipt will still work without QR code
- Check server logs for QR code errors

---

## 📝 Next Steps

1. ✅ Test receipt generation with existing orders
2. ✅ Customize business information
3. ✅ Test with different order types
4. ✅ Verify all information is correct
5. ✅ Test print functionality

---

## 🎉 You're All Set!

The receipt generation feature is ready to use. Start testing and customize the business information as needed.

**Happy Receipt Generating! 🧾✨**

