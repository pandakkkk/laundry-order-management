# 🧺 Laundry Workflow & Status Guide

## Complete Order Status Flow

This system tracks orders through the entire laundry process with **15 distinct statuses** designed specifically for laundry operations.

### 📋 Main Processing Workflow

```
📥 Received
    ↓
📦 Sorting
    ↓
🔍 Spotting (stain treatment)
    ↓
🧼 Washing  OR  🧴 Dry Cleaning
    ↓
💨 Drying
    ↓
👔 Ironing
    ↓
✔️ Quality Check
    ↓
📦 Packing
    ↓
✅ Ready for Pickup  OR  🚚 Out for Delivery
    ↓
✨ Delivered
```

### 🔄 Alternative Flows

**Customer Issues:**
```
↩️ Return (customer returns items)
💸 Refund (money refunded)
```

**Cancellation:**
```
❌ Cancelled (order cancelled before completion)
```

---

## 📖 Status Definitions

### 1. 📥 **Received**
- **When**: Order just arrived at the laundry
- **What**: Items logged into system, receipt generated
- **Duration**: Few minutes
- **Next**: Sorting

### 2. 📦 **Sorting**
- **When**: Items being categorized
- **What**: Separating by fabric type, color, cleaning method
- **Duration**: 5-15 minutes
- **Next**: Spotting or directly to Washing/Dry Cleaning

### 3. 🔍 **Spotting**
- **When**: Stains or spots detected
- **What**: Pre-treatment of stains before washing
- **Duration**: 10-30 minutes
- **Next**: Washing or Dry Cleaning

### 4. 🧼 **Washing**
- **When**: Regular machine wash items
- **What**: Items in washing machine
- **Duration**: 30-60 minutes
- **Next**: Drying
- **Items**: Cotton, linen, regular fabrics

### 5. 🧴 **Dry Cleaning**
- **When**: Delicate or special care items
- **What**: Chemical cleaning process
- **Duration**: 2-4 hours
- **Next**: Drying or directly to Ironing
- **Items**: Silk, wool, suits, formal wear

### 6. 💨 **Drying**
- **When**: After washing or dry cleaning
- **What**: Machine drying or air drying
- **Duration**: 30-90 minutes
- **Next**: Ironing

### 7. 👔 **Ironing**
- **When**: Items need pressing
- **What**: Pressing and steaming clothes
- **Duration**: 5-15 minutes per item
- **Next**: Quality Check

### 8. ✔️ **Quality Check**
- **When**: Before packing
- **What**: Final inspection for cleanliness, damages, missing buttons
- **Duration**: 2-5 minutes
- **Next**: Packing

### 9. 📦 **Packing**
- **When**: After quality check
- **What**: Items being wrapped, tagged, and packaged
- **Duration**: 5-10 minutes
- **Next**: Ready for Pickup or Out for Delivery

### 10. ✅ **Ready for Pickup**
- **When**: Customer needs to collect
- **What**: Waiting for customer to arrive
- **Duration**: Hours to days
- **Next**: Delivered (when picked up)

### 11. 🚚 **Out for Delivery**
- **When**: Delivery service opted
- **What**: Items in transit to customer
- **Duration**: 30 minutes - 2 hours
- **Next**: Delivered

### 12. ✨ **Delivered**
- **When**: Order completed
- **What**: Items handed over to customer
- **Duration**: Final status
- **Next**: None (or Return if issues)

### 13. ↩️ **Return**
- **When**: Customer not satisfied
- **What**: Items returned for re-processing or refund
- **Duration**: Varies
- **Next**: May go back to processing or Refund
- **Reasons**: Poor quality, damage, wrong items, stains not removed

### 14. 💸 **Refund**
- **When**: Money being returned
- **What**: Full or partial refund processed
- **Duration**: Final status
- **Next**: None
- **Reasons**: Severe damage, lost items, major quality issues

### 15. ❌ **Cancelled**
- **When**: Before completion
- **What**: Order terminated
- **Duration**: Final status
- **Reasons**: Customer request, unable to process, payment issues

---

## 📊 Dashboard Statistics

The dashboard shows count for each status:

- **Total Orders**: All orders in system
- **Received**: New orders just in
- **In Process**: Combined count (Sorting + Spotting + Washing + Dry Cleaning + Drying + Ironing + Quality Check + Packing)
- **Washing**: Currently being washed
- **Dry Cleaning**: In dry cleaning process
- **Ironing**: Being ironed
- **Ready for Pickup**: Awaiting customer collection
- **Out for Delivery**: In transit
- **Delivered**: Successfully completed
- **Return**: Items returned
- **Refund**: Money refunded
- **Today's Orders**: Orders received today
- **Total Revenue**: Sum of all non-cancelled orders

---

## ⏱️ Typical Timeline

### Express Service (Same Day)
- Received: 9:00 AM
- Sorting: 9:10 AM
- Washing: 9:30 AM
- Drying: 10:30 AM
- Ironing: 11:30 AM
- Quality Check: 12:00 PM
- Ready: 12:30 PM
- **Total: 3.5 hours**

### Standard Service (2-3 Days)
- Day 1: Received → Sorting → Spotting → Washing/Dry Cleaning
- Day 2: Drying → Ironing → Quality Check → Packing
- Day 3: Ready for Pickup/Delivery → Delivered
- **Total: 2-3 days**

### Dry Cleaning Only (1-2 Days)
- Day 1: Received → Sorting → Dry Cleaning
- Day 2: Ironing → Quality Check → Packing → Ready
- **Total: 1-2 days**

---

## 🎯 Best Practices

### For Staff
1. **Update status promptly** after each step
2. **Add notes** for special care or issues
3. **Mark spotting** if stains are found
4. **Quality check** is mandatory before packing
5. **Call customer** when Ready for Pickup

### For Management
1. **Monitor In Process** count - shouldn't be too high
2. **Track overdue orders** - auto-flagged in dashboard
3. **Watch Return/Refund rates** - quality indicator
4. **Check Washing/Ironing queues** - identify bottlenecks
5. **Review Ready for Pickup age** - follow up old pickups

### For Customers
1. **Check status online** - know when to pickup
2. **Respond to alerts** - when order is Ready
3. **Report issues early** - for quick resolution
4. **Request status** if unsure

---

## 🚨 Alert Triggers

- **Overdue**: Order past expected delivery date (visual warning ⚠️)
- **Stuck**: Order in same status > 24 hours
- **Ready Long**: In "Ready for Pickup" > 3 days
- **Return**: Immediate quality review needed
- **Refund**: Management approval required

---

## 💡 Tips for Efficiency

1. **Batch similar items** in Washing/Ironing stages
2. **Pre-spot all items** during Sorting to save time
3. **Dry clean overnight** for next-day service
4. **Pack immediately** after Quality Check
5. **Group deliveries** by location

---

## 📈 Analytics Insights

Track these metrics:
- **Average time per status** - identify bottlenecks
- **Return rate** - quality indicator
- **Refund amount** - financial impact
- **Ready for Pickup duration** - customer engagement
- **Status distribution** - workload balance

---

Built with ❤️ for efficient laundry management!

