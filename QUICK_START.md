# 🚀 Quick Start Guide - Environment Setup

## Super Easy Setup (Recommended for Beginners)

### Method 1: Using the Setup Script

1. **Double-click** `setup-env.bat` in your project folder
2. **Follow the instructions** in the command window
3. **Keep that command window open** and use it to run your application

### Method 2: Manual Setup (if you prefer)

1. **Open Command Prompt** (Press `Win + R`, type `cmd`, press Enter)

2. **Navigate to your project:**
   ```cmd
   cd C:\Projects\book-as-a-service
   ```

3. **Set the environment variables** (copy and paste these commands):
   ```cmd
   set JWT_SECRET=5bJesUzp7FmYQTD10QxMrAIkpgVw6Zw3DchjZaaNQCJdXxnG728mThpdK69naSImRsJZjppwd566mWcv5LzyZQ==
   set DB_PASSWORD=MySecurePassword123!
   set NLB_MERCHANT_ID=dev-merchant-id
   set NLB_SECRET_KEY=dev-secret-key
   ```

## 🔧 What These Variables Do:

- **JWT_SECRET**: Secures your user login tokens (I generated this for you!)
- **DB_PASSWORD**: Password for your PostgreSQL database
- **NLB_MERCHANT_ID/NLB_SECRET_KEY**: Payment system credentials (set to safe dev values)

## 🏃‍♂️ Running Your Application

After setting up environment variables:

1. **Start the backend:**
   ```cmd
   cd backend\readify
   mvn spring-boot:run
   ```

2. **Start the frontend** (in a new command window):
   ```cmd
   cd frontend
   npm run dev
   ```

## 🔍 Troubleshooting

**"Database connection failed"?**
- Make sure PostgreSQL is running
- Create a database called `readify_db`
- Set the PostgreSQL password to match `DB_PASSWORD`

**"JWT secret error"?**
- Make sure you ran the setup script or set the environment variables
- The JWT_SECRET should be exactly as provided above

**"Environment variable not found"?**
- Run the commands in the same command window where you set the variables
- Or use the `setup-env.bat` script

## 🎯 Next Steps

Once both applications are running:
1. Open your browser to `http://localhost:3000`
2. Your backend API will be at `http://localhost:8080`
3. You're ready to test the application!

## 💡 Tips for Beginners

- **Keep the command windows open** while developing
- **Use the same command window** for setting variables and running the app
- **If you close the window**, you'll need to set the variables again
- **For permanent setup**, see the "Making Variables Permanent" section below

## 🔒 Making Variables Permanent (Optional)

If you want to avoid setting these every time:

1. Press `Win + R`, type `sysdm.cpl`, press Enter
2. Click "Environment Variables" button
3. Under "User variables", click "New"
4. Add each variable:
   - Variable name: `JWT_SECRET`
   - Variable value: `5bJesUzp7FmYQTD10QxMrAIkpgVw6Zw3DchjZaaNQCJdXxnG728mThpdK69naSImRsJZjppwd566mWcv5LzyZQ==`
5. Repeat for `DB_PASSWORD`, `NLB_MERCHANT_ID`, and `NLB_SECRET_KEY`
6. Click OK and restart your command prompt

Need help? The setup script has all the details!