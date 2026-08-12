# Project Deploy Guide (Render + MongoDB Atlas)

এই প্রজেক্টে Express server একই সঙ্গে `frontend` ফোল্ডারের landing page এবং API চালায়। তাই আলাদা করে frontend deploy করার দরকার নেই।

## 1. GitHub-এ কোড পাঠান

1. নতুন একটি private GitHub repository তৈরি করুন।
2. পুরো project folder (`backend` এবং `frontend` দুটোই) সেখানে push করুন।
3. `.env` ফাইল push করবেন না।

## 2. MongoDB Atlas database তৈরি করুন

1. [MongoDB Atlas](https://www.mongodb.com/atlas) এ free account/project তৈরি করুন।
2. একটি free M0 cluster তৈরি করুন।
3. **Database Access** থেকে database user ও শক্তিশালী password তৈরি করুন।
4. **Network Access** থেকে Render-এর জন্য access দিন। শুরুতে `0.0.0.0/0` ব্যবহার করা যায়; পরে প্রয়োজনমতো সীমিত করবেন।
5. **Connect > Drivers > Node.js** থেকে connection string কপি করুন। এতে `<password>`-এর জায়গায় আপনার password বসান।

উদাহরণ:
```
mongodb+srv://myuser:my-password@cluster0.xxxxx.mongodb.net/sms-database?retryWrites=true&w=majority
```

## 3. Render-এ deploy করুন

1. [Render](https://render.com) এ লগইন করে **New > Web Service** বাছুন।
2. আপনার GitHub repository connect করুন।
3. নিচের মানগুলো দিন:

| Setting | Value |
|---|---|
| Root Directory | `backend` |
| Runtime | Node |
| Build Command | `npm install` |
| Start Command | `npm start` |

4. **Environment Variables** এ যোগ করুন:

| Key | Value |
|---|---|
| `MONGODB_URI` | Atlas থেকে পাওয়া সম্পূর্ণ connection string |
| `NODE_ENV` | `production` |
| `JWT_SECRET` | অন্তত 32 অক্ষরের একটি গোপন random text |

5. **Create Web Service** চাপুন এবং deploy শেষ হওয়া পর্যন্ত অপেক্ষা করুন।
6. Render যে URL দেবে, যেমন `https://your-sms.onrender.com`, সেটিই আপনার পুরো website এবং admin panel-এর URL।

## 4. Deploy-এর পর পরীক্ষা

1. `https://your-domain/api/health` খুলে `status: OK` পাচ্ছেন কি না দেখুন।
2. `https://your-domain/settings.html` খুলে Landing Content থেকে একটি banner বা card পরিবর্তন করুন।
3. অন্য browser/incognito-তে home page খুলে পরিবর্তনটি দেখা যাচ্ছে কি না পরীক্ষা করুন।

## নোট

- Free Render service কিছুক্ষণ ব্যবহার না হলে sleep করে; প্রথম request-এ 30–60 সেকেন্ড লাগতে পারে।
- Banner image এখন database-এ সংরক্ষিত হয়; 2MB-এর কম image ব্যবহার করুন। নিয়মিত বড় image দিলে পরে Cloudinary/S3 image hosting ব্যবহার করা ভালো।
- Production-এ admin page এখনো আলাদা login protection ছাড়া খোলা থাকে। বাস্তব site চালুর আগে admin authentication/authorization যোগ করা উচিত।
