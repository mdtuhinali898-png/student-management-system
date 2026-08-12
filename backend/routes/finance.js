const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const Payment = require('../models/Payment');
const Student = require('../models/Student');

// ─── Helper: Date Range ───────────────────────────────────────────────────────
function getDateRange(query) {
    const { period, startDate, endDate } = query;
    const now  = new Date();
    const today = now.toISOString().split('T')[0];
    let fromDate, toDate = today;

    switch (period) {
        case 'today':     fromDate = today; break;
        case 'week':      { const w = new Date(now); w.setDate(w.getDate()-7); fromDate = w.toISOString().split('T')[0]; break; }
        case 'month':     fromDate = today.slice(0,8)+'01'; break;
        case 'lastMonth': {
            const f = new Date(now.getFullYear(), now.getMonth()-1, 1);
            const l = new Date(now.getFullYear(), now.getMonth(), 0);
            fromDate = f.toISOString().split('T')[0];
            toDate   = l.toISOString().split('T')[0];
            break;
        }
        case 'year':   fromDate = now.getFullYear()+'-01-01'; break;
        case 'custom': fromDate = startDate || today.slice(0,8)+'01'; toDate = endDate || today; break;
        default:       fromDate = today.slice(0,8)+'01';
    }
    return { fromDate, toDate };
}

// ─── GET /api/finance/overview ────────────────────────────────────────────────
router.get('/overview', async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const currentMonthName = new Date().toLocaleString('default', { month: 'long' });
        const currentYear = new Date().getFullYear();
        const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate()-7);
        const weekAgoStr = weekAgo.toISOString().split('T')[0];

        const [payAgg, expAgg] = await Promise.all([
            Payment.aggregate([{ $facet: {
                today:   [{ $match: { date: today } },                                              { $group: { _id: null, t: { $sum: '$amount' } } }],
                month:   [{ $match: { month: currentMonthName, year: currentYear } },               { $group: { _id: null, t: { $sum: '$amount' } } }],
                week:    [{ $match: { date: { $gte: weekAgoStr, $lte: today } } },                  { $group: { _id: null, t: { $sum: '$amount' } } }],
                year:    [{ $match: { year: currentYear } },                                        { $group: { _id: null, t: { $sum: '$amount' } } }],
                allTime: [{ $group: { _id: null, t: { $sum: '$amount' } } }],
                byType:  [{ $group: { _id: '$type', t: { $sum: '$amount' } } }]
            }}]),
            Expense.aggregate([{ $facet: {
                today:   [{ $match: { date: today, status: 'Approved' } },                                            { $group: { _id: null, t: { $sum: '$amount' } } }],
                month:   [{ $match: { month: currentMonthName, year: currentYear, status: 'Approved' } },             { $group: { _id: null, t: { $sum: '$amount' } } }],
                week:    [{ $match: { date: { $gte: weekAgoStr, $lte: today }, status: 'Approved' } },                { $group: { _id: null, t: { $sum: '$amount' } } }],
                year:    [{ $match: { year: currentYear, status: 'Approved' } },                                      { $group: { _id: null, t: { $sum: '$amount' } } }],
                allTime: [{ $match: { status: 'Approved' } },                                                         { $group: { _id: null, t: { $sum: '$amount' } } }]
            }}])
        ]);

        const pa = payAgg[0], ea = expAgg[0];
        const g = (facet) => facet[0]?.t || 0;

        const todayC = g(pa.today), todayE = g(ea.today);
        const monthC = g(pa.month), monthE = g(ea.month);
        const weekC  = g(pa.week),  weekE  = g(ea.week);
        const yearC  = g(pa.year),  yearE  = g(ea.year);
        const totC   = g(pa.allTime), totE = g(ea.allTime);

        const incomeBySource = {};
        (pa.byType||[]).forEach(s => {
            const lbl = s._id === 'Admission' ? 'Admission Fee' : 'Monthly Student Fee';
            incomeBySource[lbl] = (incomeBySource[lbl]||0) + s.t;
        });

        res.json({ success: true,
            today:   { collection: todayC, expense: todayE, net: todayC-todayE, netType: todayC-todayE>=0?'Profit':'Loss' },
            weekly:  { collection: weekC,  expense: weekE,  net: weekC-weekE,   netType: weekC-weekE>=0?'Profit':'Loss'  },
            monthly: { collection: monthC, expense: monthE, net: monthC-monthE, netType: monthC-monthE>=0?'Profit':'Loss'},
            yearly:  { collection: yearC,  expense: yearE,  net: yearC-yearE,   netType: yearC-yearE>=0?'Profit':'Loss'  },
            total:   { collection: totC,   expense: totE,   net: totC-totE,     netType: totC-totE>=0?'Profit':'Loss'    },
            incomeBySource
        });
    } catch (err) {
        console.error('overview error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// ─── GET /api/finance/dashboard ──────────────────────────────────────────────
// Optimized: 18 separate queries → 3 aggregations
router.get('/dashboard', async (req, res) => {
    try {
        const { period, startDate, endDate, month } = req.query;
        const { fromDate, toDate } = getDateRange({ period, startDate, endDate });

        const currentMonthName = new Date().toLocaleString('default', { month: 'long' });
        const currentYear = new Date().getFullYear();
        const today = new Date().toISOString().split('T')[0];
        const selectedMonth = month || '';

        // ── 1. Single $facet aggregation for all payment stats ────────────────
        const [payAgg, expAgg] = await Promise.all([
            Payment.aggregate([{ $facet: {
                byRange:  [{ $match: { date: { $gte: fromDate, $lte: toDate } } },
                            { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }],
                today:    [{ $match: { date: today } },
                            { $group: { _id: null, total: { $sum: '$amount' } } }],
                month:    [{ $match: { month: currentMonthName, year: currentYear } },
                            { $group: { _id: null, total: { $sum: '$amount' } } }],
                allTime:  [{ $group: { _id: null, total: { $sum: '$amount' } } }],
                recent:   [{ $sort: { createdAt: -1 } }, { $limit: 5 }],
                byMethod: [{ $group: { _id: '$paymentMethod', total: { $sum: '$amount' } } }],
                byType:   [{ $group: { _id: '$type',          total: { $sum: '$amount' } } }]
            }}]),
            Expense.aggregate([{ $facet: {
                byRange:  [{ $match: { date: { $gte: fromDate, $lte: toDate }, status: 'Approved' } },
                            { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }],
                today:    [{ $match: { date: today, status: 'Approved' } },
                            { $group: { _id: null, total: { $sum: '$amount' } } }],
                month:    [{ $match: { month: currentMonthName, year: currentYear, status: 'Approved' } },
                            { $group: { _id: null, total: { $sum: '$amount' } } }],
                allTime:  [{ $match: { status: 'Approved' } },
                            { $group: { _id: null, total: { $sum: '$amount' } } }],
                recent:   [{ $sort: { createdAt: -1 } }, { $limit: 5 }],
                byMethod: [{ $match: { status: 'Approved' } },
                            { $group: { _id: '$paymentMethod', total: { $sum: '$amount' } } }],
                incSrc:   [{ $match: { incomeSource: { $ne: '' }, status: 'Approved' } },
                            { $group: { _id: '$incomeSource', total: { $sum: '$amount' } } }]
            }}])
        ]);

        const pa = payAgg[0], ea = expAgg[0];
        const g = f => f[0]?.total || 0;

        const rangeIncome       = g(pa.byRange),  rangePaymentCount = pa.byRange[0]?.count || 0;
        const rangeExpense      = g(ea.byRange),  rangeExpenseCount = ea.byRange[0]?.count || 0;
        const todayCollection   = g(pa.today),    todayExpense      = g(ea.today);
        const monthlyCollection = g(pa.month),    monthlyExpense    = g(ea.month);
        const totalCollection   = g(pa.allTime),  totalExpense      = g(ea.allTime);

        const recentPayments = pa.recent || [];
        const recentExpenses = ea.recent || [];

        // ── 2. Balance by payment method ──────────────────────────────────────
        const payM = {}, expM = {};
        (pa.byMethod||[]).forEach(r => { payM[r._id] = r.total; });
        (ea.byMethod||[]).forEach(r => { expM[r._id] = r.total; });

        const gP = (...m) => m.reduce((s,x) => s+(payM[x]||0), 0);
        const gE = (...m) => m.reduce((s,x) => s+(expM[x]||0), 0);

        const cashInHand   = gP('Cash')                             - gE('Cash');
        const bankBalance  = gP('Bank Transfer','Bank','Cheque')    - gE('Bank','Cheque');
        const bKashBalance = gP('bKash')                            - gE('bKash');
        const nagadBalance = gP('Nagad')                            - gE('Nagad');
        const otherBalance = gP('Rocket','Card')                    - gE('Rocket','Card');
        const totalAvailableBalance = cashInHand + bankBalance + bKashBalance + nagadBalance + otherBalance;

        // ── 3. Income by source ───────────────────────────────────────────────
        const incomeBySource = {};
        (pa.byType||[]).forEach(s => {
            const lbl = s._id === 'Admission' ? 'Admission Fee' : 'Monthly Student Fee';
            incomeBySource[lbl] = (incomeBySource[lbl]||0) + s.total;
        });
        (ea.incSrc||[]).forEach(s => {
            if (s._id) incomeBySource[s._id] = (incomeBySource[s._id]||0) + s.total;
        });

        // ── 4. Due summary (month-wise: Jan → current month, or selected month) ──
        const currentMonthIndex = new Date().getMonth(); // 0-based (Jan=0)
        const monthNames = ['January','February','March','April','May','June',
                            'July','August','September','October','November','December'];
        const monthsElapsed = monthNames.slice(0, currentMonthIndex + 1);
        const targetMonths = selectedMonth ? [selectedMonth] : monthsElapsed;

        const [activeStudents, allYearPayments] = await Promise.all([
            Student.find({ status: 'Active' }).select('studentId name phone batch fee').lean(),
            Payment.find({ year: currentYear }).select('studentId amount month year').lean()
        ]);

        // Map: studentId → { monthName: totalPaid }
        const pMap = {};
        allYearPayments.forEach(p => {
            if (!pMap[p.studentId]) pMap[p.studentId] = {};
            pMap[p.studentId][p.month] = (pMap[p.studentId][p.month] || 0) + (p.amount || 0);
        });

        let totalOutstandingFee = 0;
        const studentWiseDue = [];
        const batchWiseDue   = {};

        activeStudents.forEach(s => {
            const fee = s.fee || 0;
            if (fee <= 0) return;
            const sPays = pMap[s.studentId] || {};

            let due = 0;
            const unpaidMonths = [];
            targetMonths.forEach(m => {
                const paid = sPays[m] || 0;
                if (paid === 0) {
                    const monthDue = fee - paid;
                    due += monthDue;
                    unpaidMonths.push({ month: m, due: monthDue });
                }
            });

            if (due > 0) {
                totalOutstandingFee += due;
                studentWiseDue.push({ studentId: s.studentId, name: s.name, phone: s.phone, batch: s.batch, fee, due, unpaidMonths });
                if (!batchWiseDue[s.batch]) batchWiseDue[s.batch] = { total: 0, count: 0 };
                batchWiseDue[s.batch].total += due;
                batchWiseDue[s.batch].count += 1;
            }
        });
        studentWiseDue.sort((a,b) => b.due - a.due);
        const topDueStudents = studentWiseDue.slice(0,5);
        const overdueCount   = studentWiseDue.length;
        const todayExpectedCollection = studentWiseDue.slice(0,20).reduce((s,x) => s+x.fee, 0);
        const batchWiseDueArray = Object.entries(batchWiseDue).map(([batch,d]) => ({ batch, total: d.total, count: d.count }));

        res.json({
            success: true,
            range: { fromDate, toDate, income: rangeIncome, expense: rangeExpense,
                     net: rangeIncome-rangeExpense, netType: rangeIncome-rangeExpense>=0?'Profit':'Loss',
                     paymentCount: rangePaymentCount, expenseCount: rangeExpenseCount },
            todayCollection, todayExpense, todayNet: todayCollection-todayExpense,
            todayNetType: todayCollection-todayExpense>=0?'Profit':'Loss',
            monthlyCollection, monthlyExpense, monthlyNet: monthlyCollection-monthlyExpense,
            monthlyNetType: monthlyCollection-monthlyExpense>=0?'Profit':'Loss',
            totalCollection, totalExpense, totalNet: totalCollection-totalExpense,
            totalNetType: totalCollection-totalExpense>=0?'Profit':'Loss',
            balances: { cashInHand, bankBalance, bKashBalance, nagadBalance, otherBalance, totalAvailableBalance },
            incomeBySource,
            dueSummary: { totalOutstandingFee, todayExpectedCollection, overdueCount, totalStudentsWithDue: overdueCount, topDueStudents, batchWiseDue: batchWiseDueArray },
            recentExpenses, recentPayments
        });
    } catch (err) {
        console.error('dashboard error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// ─── GET /api/finance/graph-data ─────────────────────────────────────────────
// Optimized: 37 loops (74 queries) → 4 aggregations
router.get('/graph-data', async (req, res) => {
    try {
        const currentYear = new Date().getFullYear();
        const months = ['January','February','March','April','May','June',
                        'July','August','September','October','November','December'];

        // All 4 heavy queries in parallel
        const [payMonthly, expMonthly, categoryData, methodData, payTrend, expTrend] = await Promise.all([
            // Monthly totals for the year — single aggregation
            Payment.aggregate([
                { $match: { year: currentYear } },
                { $group: { _id: '$month', total: { $sum: '$amount' } } }
            ]),
            Expense.aggregate([
                { $match: { year: currentYear, status: 'Approved' } },
                { $group: { _id: '$month', total: { $sum: '$amount' } } }
            ]),
            // Category pie
            Expense.aggregate([
                { $match: { year: currentYear, status: 'Approved' } },
                { $group: { _id: '$category', total: { $sum: '$amount' } } },
                { $sort:  { total: -1 } }
            ]),
            // Method breakdown
            Payment.aggregate([
                { $group: { _id: '$paymentMethod', total: { $sum: '$amount' }, count: { $sum: 1 } } }
            ]),
            // Trend: last 30 days — single query, group by date
            Payment.aggregate([
                { $match: { date: { $gte: (() => { const d=new Date(); d.setDate(d.getDate()-29); return d.toISOString().split('T')[0]; })() } } },
                { $group: { _id: '$date', income: { $sum: '$amount' } } }
            ]),
            Expense.aggregate([
                { $match: { date: { $gte: (() => { const d=new Date(); d.setDate(d.getDate()-29); return d.toISOString().split('T')[0]; })() }, status: 'Approved' } },
                { $group: { _id: '$date', expense: { $sum: '$amount' } } }
            ])
        ]);

        // Build monthly data map
        const payMap = {}, expMap = {};
        payMonthly.forEach(r => { payMap[r._id] = r.total; });
        expMonthly.forEach(r => { expMap[r._id] = r.total; });

        const monthlyData = months.map(m => ({
            month:     m.slice(0,3),
            fullMonth: m,
            income:    payMap[m] || 0,
            expense:   expMap[m] || 0
        }));

        // Income source (from payment type)
        const payByType = await Payment.aggregate([
            { $match: { year: currentYear } },
            { $group: { _id: '$type', total: { $sum: '$amount' } } }
        ]);
        const incSrcMap = {};
        payByType.forEach(s => {
            const lbl = s._id === 'Admission' ? 'Admission Fee' : 'Monthly Student Fee';
            incSrcMap[lbl] = (incSrcMap[lbl]||0) + s.total;
        });
        const incomeSourceData = Object.entries(incSrcMap).map(([source, total]) => ({ source, total }));

        // Build trend maps
        const trendPayMap = {}, trendExpMap = {};
        payTrend.forEach(r => { trendPayMap[r._id] = r.income; });
        expTrend.forEach(r => { trendExpMap[r._id] = r.expense; });

        const today = new Date();
        const buildTrend = (days) => Array.from({ length: days }, (_, i) => {
            const d = new Date(today);
            d.setDate(d.getDate() - (days-1-i));
            const ds = d.toISOString().split('T')[0];
            return {
                date: ds,
                income:  trendPayMap[ds] || 0,
                expense: trendExpMap[ds] || 0,
                label: days === 7
                    ? d.toLocaleDateString('en', { weekday:'short', day:'numeric' })
                    : d.toLocaleDateString('en', { month:'short', day:'numeric' })
            };
        });

        res.json({
            success: true,
            monthlyData,
            categoryData: categoryData.map(c => ({ category: c._id, total: c.total })),
            methodData:   methodData.map(m => ({ method: m._id, total: m.total, count: m.count })),
            incomeSourceData,
            trend: { last7Days: buildTrend(7), last30Days: buildTrend(30) }
        });
    } catch (err) {
        console.error('graph-data error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// ─── GET /api/finance/income-sources ─────────────────────────────────────────
router.get('/income-sources', async (req, res) => {
    try {
        const { period, startDate, endDate } = req.query;
        const { fromDate, toDate } = getDateRange({ period, startDate, endDate });

        const [byType, incSrc] = await Promise.all([
            Payment.aggregate([
                { $match: { date: { $gte: fromDate, $lte: toDate } } },
                { $group: { _id: '$type', total: { $sum: '$amount' } } }
            ]),
            Expense.aggregate([
                { $match: { incomeSource: { $ne:'' }, date: { $gte: fromDate, $lte: toDate }, status: 'Approved' } },
                { $group: { _id: '$incomeSource', total: { $sum: '$amount' } } }
            ])
        ]);

        const srcMap = {};
        byType.forEach(s => {
            const lbl = s._id === 'Admission' ? 'Admission Fee' : 'Monthly Student Fee';
            srcMap[lbl] = (srcMap[lbl]||0) + s.total;
        });
        incSrc.forEach(s => { if (s._id) srcMap[s._id] = (srcMap[s._id]||0) + s.total; });

        const totalIncome = Object.values(srcMap).reduce((a,b) => a+b, 0);
        res.json({
            success: true,
            incomeBySource: Object.entries(srcMap).map(([source, total]) => ({
                source, total, percentage: totalIncome > 0 ? Math.round((total/totalIncome)*100) : 0
            })),
            totalIncome, fromDate, toDate
        });
    } catch (err) {
        console.error('income-sources error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// ─── GET /api/finance/due-summary ────────────────────────────────────────────
// Optimized: 2 queries + in-memory calculation
// Supports ?month=March → shows due for that specific month only
// No month → shows cumulative due from Jan → current month
router.get('/due-summary', async (req, res) => {
    try {
        const currentYear = new Date().getFullYear();
        const currentMonthIndex = new Date().getMonth(); // 0-based (Jan=0)
        const monthNames = ['January','February','March','April','May','June',
                            'July','August','September','October','November','December'];
        const monthsElapsed = monthNames.slice(0, currentMonthIndex + 1);

        // Selected month filter (optional)
        const selectedMonth = req.query.month || '';
        const targetMonths = selectedMonth
            ? [selectedMonth]  // only the selected month
            : monthsElapsed;   // Jan → current month

        const [activeStudents, allPayments] = await Promise.all([
            Student.find({ status: 'Active' }).select('studentId name phone batch fee').lean(),
            Payment.find({ year: currentYear }).select('studentId amount month year').lean()
        ]);

        // Map: studentId → { monthName: totalPaid }
        const pMap = {};
        allPayments.forEach(p => {
            if (!pMap[p.studentId]) pMap[p.studentId] = {};
            pMap[p.studentId][p.month] = (pMap[p.studentId][p.month] || 0) + (p.amount || 0);
        });

        let totalOutstandingFee = 0;
        const studentWiseDue = [];
        const batchWiseDue   = {};

        activeStudents.forEach(s => {
            const fee = s.fee || 0;
            if (fee <= 0) return;
            const sPays = pMap[s.studentId] || {};

            let due = 0;
            const unpaidMonths = [];
            targetMonths.forEach(m => {
                const paid = sPays[m] || 0;
                if (paid === 0) {
                    due += fee;
                    unpaidMonths.push({ month: m, due: fee });
                }
            });

            if (due > 0) {
                totalOutstandingFee += due;
                studentWiseDue.push({ studentId: s.studentId, name: s.name, phone: s.phone, batch: s.batch, fee, due, unpaidMonths });
                if (!batchWiseDue[s.batch]) batchWiseDue[s.batch] = { total:0, count:0 };
                batchWiseDue[s.batch].total += due;
                batchWiseDue[s.batch].count += 1;
            }
        });
        studentWiseDue.sort((a,b) => b.due-a.due);

        res.json({
            success: true,
            selectedMonth: selectedMonth || null,
            totalOutstandingFee,
            todayExpectedCollection: studentWiseDue.slice(0,20).reduce((s,x) => s+x.fee, 0),
            overdueCount:  studentWiseDue.length,
            topDueStudents: studentWiseDue.slice(0,5),
            batchWiseDue:  Object.entries(batchWiseDue).map(([batch,d]) => ({ batch, total:d.total, count:d.count })),
            totalStudentsWithDue: studentWiseDue.length
        });
    } catch (err) {
        console.error('due-summary error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// ─── GET /api/finance/balances ────────────────────────────────────────────────
router.get('/balances', async (req, res) => {
    try {
        const [payM, expM] = await Promise.all([
            Payment.aggregate([{ $group: { _id:'$paymentMethod', total:{ $sum:'$amount' } } }]),
            Expense.aggregate([{ $match:{ status:'Approved' } }, { $group:{ _id:'$paymentMethod', total:{ $sum:'$amount' } } }])
        ]);
        const pMap={}, eMap={};
        payM.forEach(r => { pMap[r._id]=r.total; });
        expM.forEach(r => { eMap[r._id]=r.total; });
        const gP=(...m)=>m.reduce((s,x)=>s+(pMap[x]||0),0);
        const gE=(...m)=>m.reduce((s,x)=>s+(eMap[x]||0),0);
        const cashInHand   = gP('Cash')                           - gE('Cash');
        const bankBalance  = gP('Bank Transfer','Bank','Cheque')  - gE('Bank','Cheque');
        const bKashBalance = gP('bKash')                          - gE('bKash');
        const nagadBalance = gP('Nagad')                          - gE('Nagad');
        const otherBalance = gP('Rocket','Card')                  - gE('Rocket','Card');
        res.json({ success:true, cashInHand, bankBalance, bKashBalance, nagadBalance,
                   otherBalance, totalAvailableBalance: cashInHand+bankBalance+bKashBalance+nagadBalance+otherBalance,
                   lastUpdated: new Date().toISOString() });
    } catch (err) {
        res.status(500).json({ success:false, message: err.message });
    }
});

// ─── Reports ──────────────────────────────────────────────────────────────────
router.get('/reports/daily-summary', async (req, res) => {
    try {
        const targetDate = req.query.date || new Date().toISOString().split('T')[0];
        const [payments, expenses] = await Promise.all([
            Payment.find({ date: targetDate }),
            Expense.find({ date: targetDate, status: 'Approved' })
        ]);
        const totalCollection = payments.reduce((s,p)=>s+p.amount,0);
        const totalExpense    = expenses.reduce((s,e)=>s+e.amount,0);
        const net = totalCollection - totalExpense;
        const collectionByMethod={}, expenseByCategory={};
        payments.forEach(p=>{ collectionByMethod[p.paymentMethod]=(collectionByMethod[p.paymentMethod]||0)+p.amount; });
        expenses.forEach(e=>{ expenseByCategory[e.category]=(expenseByCategory[e.category]||0)+e.amount; });
        res.json({ success:true, date:targetDate, totalCollection, totalExpense, net, netType:net>=0?'Profit':'Loss',
                   totalStudents:payments.length, totalExpenseEntries:expenses.length,
                   collectionByMethod, expenseByCategory, payments, expenses });
    } catch (err) { res.status(500).json({ success:false, message:err.message }); }
});

router.get('/reports/monthly', async (req, res) => {
    try {
        const targetMonth = req.query.month || new Date().toLocaleString('default',{month:'long'});
        const targetYear  = req.query.year  || new Date().getFullYear();
        const [payments, expenses] = await Promise.all([
            Payment.find({ month:targetMonth, year:parseInt(targetYear) }),
            Expense.find({ month:targetMonth, year:parseInt(targetYear), status:'Approved' })
        ]);
        const totalCollection = payments.reduce((s,p)=>s+p.amount,0);
        const totalExpense    = expenses.reduce((s,e)=>s+e.amount,0);
        const net = totalCollection-totalExpense;
        res.json({ success:true, month:targetMonth, year:targetYear, totalCollection, totalExpense, net,
                   netType:net>=0?'Profit':'Loss', payments, expenses });
    } catch (err) { res.status(500).json({ success:false, message:err.message }); }
});

router.get('/reports/date-range', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        if (!startDate||!endDate) return res.status(400).json({ success:false, message:'startDate and endDate required' });
        const [payments, expenses] = await Promise.all([
            Payment.find({ date:{ $gte:startDate, $lte:endDate } }),
            Expense.find({ date:{ $gte:startDate, $lte:endDate }, status:'Approved' })
        ]);
        const totalCollection = payments.reduce((s,p)=>s+p.amount,0);
        const totalExpense    = expenses.reduce((s,e)=>s+e.amount,0);
        const net = totalCollection-totalExpense;
        res.json({ success:true, startDate, endDate, totalCollection, totalExpense, net, netType:net>=0?'Profit':'Loss', payments, expenses });
    } catch (err) { res.status(500).json({ success:false, message:err.message }); }
});

router.get('/reports/income', async (req, res) => {
    try {
        const { startDate, endDate, source } = req.query;
        let query = {};
        if (startDate&&endDate) query.date = { $gte:startDate, $lte:endDate };
        const payments = await Payment.find(query).sort({ date:-1 });
        const filtered = (source&&source!=='all')
            ? payments.filter(p => (p.type==='Admission'?'Admission Fee':'Monthly Student Fee')===source)
            : payments;
        res.json({ success:true, payments:filtered, totalIncome:filtered.reduce((s,p)=>s+p.amount,0),
                   count:filtered.length, startDate:startDate||'All', endDate:endDate||'All' });
    } catch (err) { res.status(500).json({ success:false, message:err.message }); }
});

router.get('/reports/expense', async (req, res) => {
    try {
        const { startDate, endDate, category, status } = req.query;
        let query = { status:'Approved' };
        if (startDate&&endDate) query.date = { $gte:startDate, $lte:endDate };
        if (category&&category!=='all') query.category = category;
        if (status&&status!=='all') query.status = status;
        const expenses = await Expense.find(query).sort({ date:-1 });
        const byCategory = {};
        expenses.forEach(e=>{ byCategory[e.category]=(byCategory[e.category]||0)+e.amount; });
        res.json({ success:true, expenses, totalExpense:expenses.reduce((s,e)=>s+e.amount,0),
                   count:expenses.length, byCategory, startDate:startDate||'All', endDate:endDate||'All' });
    } catch (err) { res.status(500).json({ success:false, message:err.message }); }
});

module.exports = router;
