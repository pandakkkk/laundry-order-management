# 🧪 Rack Management Feature Testing Guide

## Prerequisites
- ✅ Server is running on port 5000
- ✅ Frontend is running on port 3000
- ✅ You are logged in to the application

## Testing Steps

### Step 1: Open the Application
1. Open your browser and go to: **http://localhost:3000**
2. Login with your credentials (e.g., admin@laundry.com / admin123)

### Step 2: Find or Create a Test Order
**Option A: Use Existing Order**
1. Go to "Order Tracker" page
2. Search for an existing order
3. Click on any order to open details

**Option B: Create New Order**
1. Click "New Order" button
2. Fill in the order details
3. Set status to "Ready for Pickup" or "Packing"
4. Save the order
5. Click on the order to open details

### Step 3: Test Rack Assignment
1. **Open Order Details**: Click on any order that has status:
   - "Quality Check"
   - "Packing"
   - "Ready for Pickup"
   - "Out for Delivery"

2. **Find Rack Section**: Scroll down in the order details modal
   - You should see a section titled "📦 Rack Assignment"
   - It shows "Current Rack" (should be "Not Assigned" initially)

3. **Assign to Rack**:
   - Click on any rack button (Rack 1, Rack 2, etc.)
   - You should see a success message: "Order assigned to Rack X successfully!"
   - The selected rack button should turn green
   - Current rack should update to show the assigned rack

4. **Change Rack**:
   - Click on a different rack button
   - The rack should update successfully
   - Previous rack should no longer be highlighted

5. **Remove from Rack**:
   - Click on "No Rack" button
   - The order should be removed from the rack
   - Current rack should show "Not Assigned"

### Step 4: Verify Data Persistence
1. Close the order details modal
2. Reopen the same order
3. Check if the rack assignment is still there
4. The rack should persist after page refresh

### Step 5: Test with Different Statuses
1. Change order status to "Ready for Pickup" → Rack section should appear
2. Change order status to "Delivered" → Rack section should disappear
3. Change back to "Ready for Pickup" → Rack section should appear again

## Expected Behavior

✅ **Rack Section Visibility**:
- Should appear for: Quality Check, Packing, Ready for Pickup, Out for Delivery
- Should NOT appear for: Received, Sorting, Washing, Delivered, Cancelled, etc.

✅ **Rack Buttons**:
- 8 rack buttons (Rack 1 to Rack 8) + "No Rack" button
- Current rack highlighted in blue
- Selected rack highlighted in green
- Hover effect on buttons

✅ **API Response**:
- Success message on assignment
- Order data updates immediately
- No errors in browser console

## Troubleshooting

### Issue: Rack section not appearing
**Solution**: 
- Make sure order status is one of: Quality Check, Packing, Ready for Pickup, or Out for Delivery
- Check browser console for errors
- Refresh the page

### Issue: Rack assignment not saving
**Solution**:
- Check browser console for API errors
- Verify server is running
- Check network tab in browser dev tools

### Issue: Buttons not clickable
**Solution**:
- Check if you have proper permissions (ORDER_VIEW permission required)
- Make sure you're not in a read-only mode

## Quick Test Checklist

- [ ] Rack section appears for "Ready for Pickup" orders
- [ ] Can assign order to Rack 1
- [ ] Can assign order to Rack 2
- [ ] Can change from Rack 1 to Rack 3
- [ ] Can remove rack assignment (No Rack)
- [ ] Rack assignment persists after closing/reopening order
- [ ] Rack section disappears for "Delivered" orders
- [ ] Visual feedback (colors) work correctly
- [ ] No console errors

## API Testing (Optional)

You can also test the API directly using curl:

```bash
# Get an order ID first, then update rack
curl -X PUT http://localhost:5000/api/orders/ORDER_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"rackNumber": "Rack 2"}'
```

---

**Happy Testing! 🎉**

