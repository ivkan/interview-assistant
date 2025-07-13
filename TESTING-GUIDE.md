# Interview Assistant - Complete Testing Guide

## 🎯 Prerequisites

### 1. API Keys Required
- **AssemblyAI**: Sign up at https://www.assemblyai.com/
- **OpenAI** OR **DeepSeek**: 
  - OpenAI: https://platform.openai.com/
  - DeepSeek: https://www.deepseek.com/

### 2. Environment Setup
```bash
# Clone and install
git clone <repository>
cd interview-assistant
pnpm install

# Configure API keys
cp .env.test .env
# Edit .env with your real API keys:
# VITE_ASSEMBLYAI_API_KEY=your_assemblyai_key
# VITE_OPENAI_API_KEY=your_openai_key
# VITE_DEEPSEEK_API_KEY=your_deepseek_key
```

## 🚀 End-to-End Testing

### Phase 1: Basic System Startup
```bash
pnpm run dev
```

**Expected Results:**
- ✅ Electron app launches with three-column layout
- ✅ No TypeScript errors in console
- ✅ UI shows "Start Interview" button
- ✅ Theme toggle works (light/dark)

### Phase 2: Audio System Test
1. **Click "Start Interview"**
   - ✅ Timer starts counting
   - ✅ Button changes to "End Interview"
   - ✅ Browser requests microphone permission
   
2. **Grant microphone access**
   - ✅ Green microphone icon appears in transcript column
   - ✅ Audio level bars show activity when speaking
   - ✅ "Setting up audio capture..." message appears

### Phase 3: Transcription Test
1. **Wait for connection**
   - ✅ Blue wifi icon appears (AssemblyAI connected)
   - ✅ Status changes to "Listening for speech..."

2. **Speak clearly into microphone:**
   ```
   "Hello, this is a test of the transcription system."
   ```
   
   **Expected Results:**
   - ✅ Blue box appears with partial transcript
   - ✅ White box appears with final transcript
   - ✅ Timestamp shows on transcript entry
   - ✅ Text is accurate and punctuated

### Phase 4: Question Detection Test

#### Auto-Detection Tests
Speak these phrases and verify auto-detection:

1. **Direct Questions:**
   ```
   "What is your experience with JavaScript?"
   "How do you handle debugging?"
   "Why did you choose this career?"
   ```

2. **Interview Questions:**
   ```
   "Tell me about a time you solved a difficult problem."
   "Describe your experience with React."
   "Walk me through your approach to testing."
   ```

3. **Technical Questions:**
   ```
   "How would you implement a REST API?"
   "What are the advantages of TypeScript?"
   ```

**Expected Results for Each:**
- ✅ Question automatically detected (console log shows detection)
- ✅ Transcript entry highlighted/marked as question
- ✅ Question appears in center column
- ✅ Loading indicator shows in response area

#### Manual Override Test
1. **Speak a statement:**
   ```
   "Tell me about your background and experience."
   ```

2. **Press Ctrl+Shift+Q immediately**
   
   **Expected Results:**
   - ✅ Statement gets marked as question
   - ✅ Appears in center column
   - ✅ AI response generation starts

### Phase 5: AI Response Test

**For each detected question:**
- ✅ "Generating response..." appears
- ✅ Text streams in real-time (word by word)
- ✅ Response is relevant and professional
- ✅ Loading state clears when complete
- ✅ Question appears in history column

### Phase 6: Context-Aware Response Test

1. **Add context** (via browser console temporarily):
   ```javascript
   // Open browser console and run:
   const { updateUserProfile } = window.useSettingsStore.getState();
   updateUserProfile({
     resume: "5 years React developer, worked at tech startups",
     position: "Senior Frontend Engineer",
     background: "Computer Science degree, passionate about UI/UX"
   });
   ```

2. **Ask contextual questions:**
   ```
   "What is your experience with React?"
   "Tell me about your background."
   "Why are you interested in this position?"
   ```

   **Expected Results:**
   - ✅ AI responses reference your background
   - ✅ Answers mention specific experience
   - ✅ Responses are personalized and relevant

### Phase 7: History and Navigation Test

1. **Ask multiple questions** to build history
2. **Click on previous questions** in history column
   
   **Expected Results:**
   - ✅ Questions appear in chronological order
   - ✅ Clicking history item makes it active in center
   - ✅ Auto-scroll works when at bottom
   - ✅ All Q&A pairs are preserved

### Phase 8: Error Handling Test

1. **Network interruption:**
   - Disconnect wifi → Reconnection attempts
   - ✅ Error states display clearly
   - ✅ System recovers when reconnected

2. **Invalid API key:**
   - Use invalid key → Clear error message
   - ✅ No crashes, graceful degradation

3. **Microphone denial:**
   - Deny permission → Clear instruction
   - ✅ System handles gracefully

## 🎮 Interactive Testing Scenarios

### Scenario 1: Technical Interview
```
Questions to ask:
1. "What is your experience with JavaScript frameworks?"
2. "How do you approach code review?"
3. "Describe how you would optimize a slow React component."
4. "What testing strategies do you use?"

Expected: Technical, specific responses
```

### Scenario 2: Behavioral Interview
```
Questions to ask:
1. "Tell me about a time you had to work with a difficult team member."
2. "Describe a challenging project you completed."
3. "How do you handle tight deadlines?"
4. "Give me an example of when you showed leadership."

Expected: STAR method suggestions, behavioral guidance
```

### Scenario 3: Mixed Interview with Context
```
Setup: Add detailed resume and background
Questions to ask:
1. "Why are you leaving your current position?"
2. "What interests you about our company?"
3. "How does your experience relate to this role?"

Expected: Personalized responses using your background
```

## ✅ Success Criteria

### Core Functionality
- [ ] Real-time transcription works accurately
- [ ] Question detection identifies 80%+ of questions
- [ ] AI responses are relevant and helpful
- [ ] Manual override works reliably
- [ ] Context awareness improves responses
- [ ] All visual indicators function correctly

### Performance
- [ ] Transcription latency < 2 seconds
- [ ] Question detection < 500ms
- [ ] AI response starts < 3 seconds
- [ ] UI remains responsive throughout
- [ ] Memory usage stable during long sessions

### User Experience
- [ ] Clear visual feedback for all states
- [ ] Intuitive interface requires no training
- [ ] Error messages are helpful
- [ ] Recovery from failures is automatic
- [ ] Professional appearance suitable for interviews

## 🐛 Common Issues & Solutions

### Transcription Not Working
- Check AssemblyAI API key
- Verify microphone permissions
- Test with different microphone
- Check network connectivity

### Questions Not Detected
- Speak more clearly/slowly
- Use explicit question words
- Try manual override (Ctrl+Shift+Q)
- Check console for detection logs

### AI Responses Poor Quality
- Verify OpenAI/DeepSeek API key
- Add more context in profile
- Check API quota/limits
- Try different question phrasing

### Performance Issues
- Close other applications
- Check system resources
- Reduce transcript history
- Restart application

## 📊 Test Results Template

```
Date: ___________
Tester: _________
Environment: ____

✅ PASSED / ❌ FAILED / ⚠️ PARTIAL

[ ] Audio capture and transcription
[ ] Automatic question detection  
[ ] Manual question marking
[ ] AI response generation
[ ] Context-aware responses
[ ] History management
[ ] Error handling
[ ] Performance benchmarks
[ ] UI/UX experience

Notes:
_________________
_________________
```

Ready for production testing! 🚀