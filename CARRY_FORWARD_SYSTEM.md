# Carry-Forward Balance System for Milk Billing

## Overview
The milk billing system has been extended to handle carry-forward balances based on actual payments entered by the admin. This ensures accurate financial tracking and automatic balance adjustments.

## How It Works

### 1. Bill Generation Flow
1. **Preview Bill**: Admin selects farmer and period, system shows preview with:
   - Milk earnings
   - Feed balance
   - Previous carry-forward balance
   - **Net payable** = Milk earnings - Feed deduction + Previous carry-forward

2. **Enter Payment Details**: Admin enters:
   - Feed deduction amount (optional)
   - **Actual paid amount** (required)

3. **Generate Bill**: System automatically:
   - Calculates adjustment = Actual paid - Net payable
   - Updates carry-forward balance = Previous balance + Adjustment
   - Marks bill as paid
   - Stores all payment details

### 2. Carry-Forward Balance Calculation
- **Positive adjustment** (farmer got extra money): Carry-forward increases
- **Negative adjustment** (farmer got less money): Carry-forward decreases
- **Zero adjustment** (exact payment): Carry-forward remains unchanged

### 3. Bill Record Fields
Each bill now includes:
- `previous_carry_forward`: Balance from previous bill
- `actual_paid_amount`: Amount actually paid by admin
- `adjustment`: Difference between paid and payable
- `new_carry_forward_balance`: Updated balance for next bill

## Frontend Features

### Bill Preview Section
- Shows period, milk details, feed balance
- Displays previous carry-forward amount
- **Highlights net payable amount**

### Bill Generation Form
- Feed deduction input (with available balance limit)
- **Actual paid amount input (required)**
- Generate button (disabled until payment entered)

### Enhanced History Table
- **Bill Date**: When bill was created
- **Period**: Billing period (DD/MM/YYYY format)
- **Milk Total**: Total milk earnings
- **Feed Deducted**: Feed amount deducted
- **Prev Carry-Forward**: Previous balance
- **Net Payable**: Calculated amount due
- **Actual Paid**: Amount actually paid
- **Adjustment**: Payment difference (±)
- **New Carry-Forward**: Updated balance
- **Status**: Paid/Pending
- **Actions**: Edit payment, Delete bill

## Backend API Endpoints

### 1. Preview Bill
```
POST /api/billing/preview
Body: { farmer_id, period_start, period_end }
Response: { milk, feedBalance, previousCarryForward, net_payable }
```

### 2. Generate Bill
```
POST /api/billing/generate
Body: { farmer_id, period_start, period_end, feed_deduction, actual_paid_amount }
Response: { bill, adjustment, newCarryForwardBalance }
```

### 3. Update Payment (for existing bills)
```
PUT /api/billing/payment/:billId
Body: { actual_paid_amount }
Response: { bill, adjustment, newCarryForwardBalance }
```

### 4. Get History
```
GET /api/billing/history/:farmerId
Response: { bills: [...] }
```

## Benefits

1. **Admin Control**: Admin enters actual payment amounts
2. **Automatic Calculations**: System handles all balance adjustments
3. **Transparency**: Clear view of all payment details
4. **Accuracy**: No manual carry-forward calculations needed
5. **Audit Trail**: Complete history of all payments and adjustments

## Usage Example

1. Admin selects farmer "F001" for period "01/01/2024 - 10/01/2024"
2. System shows preview: Milk ₹500, Feed ₹50, Prev Balance ₹25, Net Payable ₹475
3. Admin enters: Feed deduction ₹30, Actual paid ₹480
4. System generates bill with:
   - Adjustment: +₹5 (farmer got extra)
   - New carry-forward: ₹30 (25 + 5)
5. Next bill automatically uses ₹30 as previous carry-forward

## Technical Notes

- All dates displayed in DD/MM/YYYY format
- Currency amounts shown with ₹ symbol
- Positive adjustments shown in green, negative in red
- Bills are automatically marked as paid when generated
- Carry-forward balance is always up-to-date
