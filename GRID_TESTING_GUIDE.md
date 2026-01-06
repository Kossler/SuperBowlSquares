# Grid Numbers Implementation - Testing Guide

## Quick Start Testing

### Test 1: Create Pool with Default Numbers
1. Open Admin panel
2. Click "Create New Pool" tab
3. Enter:
   - Pool Name: `Test Pool Default`
   - Bet Amount: `$5`
   - Q1 Payout: `$50`
   - Half Payout: `$100`
   - Q3 Payout: `$75`
   - Final Payout: `$500`
   - AFC Numbers: (leave empty - will default to 0-9)
   - NFC Numbers: (leave empty - will default to 0-9)
4. Click "Create Pool"
5. Navigate to Home page
6. Select the new pool
7. **Verify**: Grid should show 0-9 across top and left side

### Test 2: Create Pool with Randomized Numbers
1. Open Admin panel
2. Click "Create New Pool" tab
3. Enter:
   - Pool Name: `Test Pool Random`
   - Bet Amount: `$5`
   - Q1 Payout: `$50`
   - Half Payout: `$100`
   - Q3 Payout: `$75`
   - Final Payout: `$500`
   - AFC Numbers: `8,0,3,5,4,1,7,2,6,9`
   - NFC Numbers: `9,2,0,4,7,8,5,1,3,6`
4. Click "Create Pool"
5. Navigate to Home page
6. Select the new pool
7. **Verify**:
   - Top row (AFC) should show: **8 0 3 5 4 1 7 2 6 9** (left to right)
   - Left column (NFC) should show: **9 2 0 4 7 8 5 1 3 6** (top to bottom)

### Test 3: Claim Squares on Custom Pool
1. With `Test Pool Random` selected on Home page
2. Click on some grid squares to claim them
3. **Verify**:
   - Squares are associated with the correct position
   - Square position matches the AFC/NFC numbers displayed
   - Claimed squares show the profile name

### Test 4: Verify Winner Highlighting with Custom Numbers
1. With `Test Pool Random` selected on Admin Scores tab
2. Set Q1 Score: AFC: 13, NFC: 12
3. Click "Update Score"
4. Navigate back to Home page
5. **Verify**:
   - Last digits: AFC=3, NFC=2
   - Find 3 in AFC numbers: Position 2 (8,0,**3**,5,4,1,7,2,6,9)
   - Find 2 in NFC numbers: Position 1 (9,**2**,0,4,7,8,5,1,3,6)
   - Square at (row=1, col=2) should be highlighted as Q1 winner (yellow color)

### Test 5: Test All Quarter Winners
1. Continue with `Test Pool Random`
2. In Admin Scores tab, set scores for all quarters:
   - Q1: AFC 13, NFC 12 (digits: 3, 2) → Square at (row 1, col 2)
   - Q2: AFC 20, NFC 14 (digits: 0, 4) → Square at (row 3, col 1)
   - Q3: AFC 27, NFC 18 (digits: 7, 8) → Square at (row 5, col 6)
   - Final: AFC 31, NFC 20 (digits: 1, 0) → Square at (row 2, col 5)
3. Navigate to Home page
4. **Verify**:
   - 4 different squares are highlighted
   - Each has the correct quarter label (Q1, Q2, Q3, FINAL)
   - Colors match the quarter (yellow=Q1, orange=Q2, green=Q3, cyan=Final)

### Test 6: Test Touching Squares Payout
1. Continue with `Test Pool Random`
2. In Admin Winners tab
3. **Verify**:
   - Check that adjacent squares (up, down, left, right) to winners are listed
   - Touch square payouts are 10% of main payout
   - Example: If Q1 winner gets $50, adjacent squares get $5 each

### Test 7: Switch Between Pools
1. Create another pool `Pool A` with: AFC=`1,2,3,4,5,6,7,8,9,0` NFC=`0,9,8,7,6,5,4,3,2,1`
2. On Home page, have two pools available
3. Select `Test Pool Random` - verify it shows `8,0,3...` across top
4. Switch to `Pool A` - verify it shows `1,2,3...` across top
5. Switch back to `Test Pool Random` - verify numbers switch back
6. **Verify**: Grid axes update correctly when switching pools

### Test 8: Admin Views Custom Numbers
1. Go to Admin panel, Pools tab
2. Click the pool created in Test 2 (`Test Pool Random`)
3. **Verify**: Can see AFC and NFC number assignments
   - AFC: 8,0,3,5,4,1,7,2,6,9
   - NFC: 9,2,0,4,7,8,5,1,3,6

## Data Integrity Tests

### Test 9: Verify Numbers Persist in Database
1. Create pool with specific numbers
2. Restart the application
3. Verify the pool still has the same numbers
4. **Expected**: Numbers should be stored in Pool entity's afcNumbers and nfcNumbers columns

### Test 10: Verify Backward Compatibility
1. Manually create a pool in the database with NULL afcNumbers and nfcNumbers
2. Load that pool on Home page
3. **Expected**: Grid should default to showing 0-9 sequential numbers

## Edge Case Tests

### Test 11: Empty AFC/NFC Fields
1. Create pool with:
   - AFC Numbers: (empty)
   - NFC Numbers: (empty)
2. Navigate to Home page
3. **Expected**: Grid defaults to 0-9 for both axes

### Test 12: Invalid Number Format (Testing Backend Validation)
1. Try to create pool with:
   - AFC Numbers: `1,2,3,4,5` (only 5 numbers)
2. **Note**: Currently no frontend validation, but server should accept it
3. **Expected**: Pool creates successfully (numbers as-is, frontend will parse whatever is provided)

### Test 13: Special Number Orders
1. Create pool with all numbers reversed:
   - AFC: `9,8,7,6,5,4,3,2,1,0`
   - NFC: `9,8,7,6,5,4,3,2,1,0`
2. On Home page, set Q1 score: AFC 19, NFC 19 (both last digit 9)
3. **Expected**: Square at (row=0, col=0) highlighted (both teams have 9 at position 0)

## Performance Tests

### Test 14: Grid Rendering Performance
1. Open Home page with custom number pool
2. **Verify**:
   - Grid renders within 1 second
   - No console errors
   - All 100 squares render correctly
   - Score highlighting is responsive

### Test 15: Pool Switching Performance
1. Have 5+ pools created
2. Rapidly switch between different pools
3. **Expected**: Smooth switching, correct numbers display for each pool

## Visual Tests

### Test 16: Color Coding Verification
- **Q1 Winner**: Yellow background
- **Q2 Winner**: Orange background
- **Q3 Winner**: Green background
- **Final Winner**: Cyan/Light Blue background

### Test 17: Score Row Display
1. Set different quarter scores
2. **Verify**:
   - Q1 row shows only the AFC digit that matches
   - Same for Q2, Q3, Final rows
   - Side boxes show only the NFC digit that matches
   - All color-coded by quarter

### Test 18: Header Alignment
1. Check that column headers (AFC numbers) align with grid columns
2. Check that row headers (NFC numbers) align with grid rows
3. **Expected**: Perfect alignment, no offset

## Browser Compatibility Tests

### Test 19: Multiple Browsers
Test the grid in:
- Chrome/Edge
- Firefox
- Safari (if available)
- Mobile browsers (responsive design)

## Integration Tests

### Test 20: Full Workflow
1. Create pool with custom numbers
2. User claims 10 squares
3. Admin sets game scores via ESP API refresh
4. Winners automatically calculated
5. Admin awards payouts
6. User sees their winning squares highlighted
7. Winner receives payment notification
8. **Expected**: All steps work seamlessly with custom numbers

## Regression Tests

### Test 21: Existing Functionality Not Broken
- ✅ User authentication still works
- ✅ Square claiming still works
- ✅ Score updates still trigger winner calculation
- ✅ Admin panel functions properly
- ✅ Payment info displays correctly
- ✅ Pool management works

## Success Criteria

**All tests pass when**:
- ✅ Grid displays custom pool numbers as axes
- ✅ Winner squares highlight correctly at intersection of score digits
- ✅ Numbers persist across sessions
- ✅ Pool switching updates grid axes
- ✅ Admin can create pools with custom numbers
- ✅ Backward compatibility maintained (defaults to 0-9)
- ✅ No errors in console
- ✅ Performance is responsive

## Known Limitations

1. **No number validation**: Currently accepts any comma-separated string for AFC/NFC numbers
   - Future enhancement: Validate that string contains exactly 10 unique digits (0-9)
2. **No visual number editor**: Must edit as text
   - Future enhancement: Drag-and-drop interface to reorder numbers
3. **No number randomizer**: Admin must manually enter randomized numbers
   - Future enhancement: Button to auto-generate random permutation

## Notes for Developers

- The grid system is **position-based**, not **number-based**
  - Squares are found by their rowPosition and colPosition (0-9)
  - This allows the same physical squares to show different numbers for different pools
- Winner calculation still uses actual **game score last digits**
  - Not the position, but the digit value matched against the assigned numbers
- The frontend parses comma-separated strings into arrays
  - Backend stores as strings for simplicity and flexibility
