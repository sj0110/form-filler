// Content script for form filling

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'fillForm') {
    fillForm(request.data)
      .then(result => {
        sendResponse({ success: true, result });
      })
      .catch(error => {
        console.error('Fill form error:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep channel open for async response
  }
  
  // Handle ping to check if script is loaded
  if (request.action === 'ping') {
    sendResponse({ success: true, message: 'Content script loaded' });
    return true;
  }
});

async function fillForm(data) {
  try {
    // Wait for form to be ready with retry
    await waitForForm();
    
    // Clean and process data before generating dynamic fields
    const cleanedData = { ...data };
    
    // Clean Annual Income - remove "per annum" and everything after
    if (cleanedData.annualIncome) {
      let income = cleanedData.annualIncome.split('per annum')[0].trim();
      // Remove "Rs." prefix if present, then add it back consistently
      income = income.replace(/^Rs\.\s*/i, '').trim();
      // Keep just the amount part (e.g., "20 Lakh")
      income = income.split('More About')[0].trim(); // Remove any trailing text
      cleanedData.annualIncome = income ? `Rs. ${income}` : cleanedData.annualIncome;
    }
    
    // Clean More About Self - ensure it doesn't include other fields
    if (cleanedData.moreAboutSelf) {
      // Remove any trailing field labels that might have been captured
      cleanedData.moreAboutSelf = cleanedData.moreAboutSelf
        .split('Your Expectation')[0]
        .split('About Parents')[0]
        .trim();
    }
    
    // Generate dynamic fields
    const dynamicFields = generateDynamicFields(cleanedData);
    const allData = { ...cleanedData, ...dynamicFields };
    
    // Ensure name is not overwritten - name should come from PDF data, not dynamic
    if (data.name) {
      allData.name = data.name;
    }
    
    // Log for debugging
    console.log('Filling form with data:', {
      name: allData.name,
      email: allData.email,
      password: allData.password,
      annualIncome: allData.annualIncome,
      moreAboutSelf: allData.moreAboutSelf,
      homeCityDistrict: allData.homeCityDistrict,
      stateCityLivingIn: allData.stateCityLivingIn
    });
    
    // Fill all fields
    const results = {
      filled: [],
      skipped: [],
      errors: []
    };
    
    // Field mapping configuration
    const fieldMappings = getFieldMappings();
    
    // Define priority order - fill critical fields first to avoid conflicts
    const fieldOrder = [
      'name', 'email', 'retypeEmail', 'password', 'retypePassword', // Identity fields first
      'age', 'gender', 'maritalStatus', // Basic info
      'education', 'educationDetail', 'occupation', // Education/Work
      'caste', 'subCaste', 'religion', 'gothram', // Background
      'homeState', 'homeCityDistrict', 'stateCityLivingIn', 'countryLivingIn', // Location
      'heightFeet', 'heightInches', 'heightCms', 'weightKg', 'weightLbs', // Physical
      'bodyType', 'complexion', 'physicalStatus', // Appearance
      'eatingHabit', 'smokingHabit', 'drinkingHabit', // Habits
      'familyValue', 'familyType', 'familyStatus', 'annualIncome', // Family
      'moreAboutSelf', 'yourExpectation', 'aboutParentsSiblings', // Text fields
      'howToKnowAboutUs' // Other
    ];
    
    // Reorder field mappings based on priority
    const orderedMappings = {};
    for (const key of fieldOrder) {
      if (fieldMappings[key]) {
        orderedMappings[key] = fieldMappings[key];
      }
    }
    // Add any remaining fields
    for (const [key, value] of Object.entries(fieldMappings)) {
      if (!orderedMappings[key]) {
        orderedMappings[key] = value;
      }
    }
    
    // Fill fields with retry logic
    for (const [pdfKey, formConfig] of Object.entries(orderedMappings)) {
      try {
        const value = allData[pdfKey];
        if (!value) {
          results.skipped.push({ field: pdfKey, reason: 'No data' });
          continue;
        }
        
        // Convert value to string for text fields
        const valueStr = String(value || '').trim();
        if (!valueStr) {
          results.skipped.push({ field: pdfKey, reason: 'Empty value' });
          continue;
        }
        
        let success = false;
        let attempts = 0;
        const maxAttempts = 3;
        
        while (!success && attempts < maxAttempts) {
          attempts++;
          
          if (formConfig.type === 'text') {
            success = fillTextField(formConfig.selector, valueStr, pdfKey);
            if (success) {
              results.filled.push({ field: pdfKey, value: valueStr });
              console.log(`✓ Filled ${pdfKey}: ${valueStr.substring(0, 50)}${valueStr.length > 50 ? '...' : ''}`);
            } else if (attempts < maxAttempts) {
              await sleep(200); // Wait before retry
            } else {
              console.warn(`✗ Failed to fill ${pdfKey} - field not found with selector: ${formConfig.selector}`);
            }
          } else if (formConfig.type === 'dropdown') {
            success = fillDropdownField(formConfig.selector, valueStr, formConfig.options);
            if (success) {
              results.filled.push({ field: pdfKey, value: valueStr });
            } else if (attempts < maxAttempts) {
              await sleep(200); // Wait before retry
            }
          }
        }
        
        if (!success) {
          results.errors.push({ 
            field: pdfKey, 
            error: formConfig.type === 'dropdown' 
              ? 'Dropdown not found or value not matched' 
              : 'Field not found' 
          });
        }
      } catch (error) {
        results.errors.push({ field: pdfKey, error: error.message });
      }
    }
    
    // Trigger change events to ensure form validation
    triggerChangeEvents();
    
    // Log results
    console.log('Form filling results:', results);
    
    return results;
  } catch (error) {
    console.error('Form filling error:', error);
    throw error;
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getFieldMappings() {
  return {
    // Left column fields - use exact ID first, then fallback to name/placeholder
    name: { type: 'text', selector: 'input#name, input[id="name"], input[name="name"], input[name*="Name"]:not([type="password"]):not([name*="Password"]), input[placeholder*="Name"]:not([type="password"])' },
    age: { type: 'text', selector: 'input[name*="Age"], input[id*="age"], input[placeholder*="Age"]' },
    education: { type: 'text', selector: 'input[name*="Education"], input[id*="education"], input[placeholder*="Education"]' },
    occupation: { type: 'text', selector: 'input[name*="Occupation"], input[id*="occupation"], input[placeholder*="Occupation"]' },
    caste: { type: 'text', selector: 'input#caste, input[id="caste"], input[name="caste"], input[name*="Caste"], input[id*="caste"], input[placeholder*="Caste"]' },
    gothram: { type: 'text', selector: 'input[name*="Gothra"], input[id*="gothra"], input[placeholder*="Gothra"]' },
    horoscopeMatch: { type: 'text', selector: 'input[name*="Horoscope"], input[id*="horoscope"], input[placeholder*="Horoscope"]' },
    rassiMoonSign: { type: 'text', selector: 'input[name*="Raasi"], input[name*="Rassi"], input[id*="raasi"], input[placeholder*="Raasi"]' },
    heightFeet: { type: 'text', selector: 'input[name*="Height Feet"], input[id*="heightFeet"], input[placeholder*="Height Feet"]' },
    heightInches: { type: 'text', selector: 'input[name*="Height Inches"], input[id*="heightInches"], input[placeholder*="Height Inches"]' },
    weightLbs: { type: 'text', selector: 'input[name*="Weight Lbs"], input[id*="weightLbs"], input[placeholder*="Weight Lbs"]' },
    homeState: { type: 'text', selector: 'input[name*="Home State"], input[id*="homeState"], input[placeholder*="Home State"]' },
    homeCityDistrict: { type: 'text', selector: 'input[id*="homeCity"], input[id*="cityDistrict"], input[name*="Home City"], input[name*="City District"], input[placeholder*="Home City"], input[placeholder*="City District"]' },
    countryLivingIn: { 
      type: 'dropdown', 
      selector: 'select[name*="Country"], select[id*="country"], select[placeholder*="Country"]',
      options: ['India', 'USA', 'UK', 'Canada', 'Australia', 'Other']
    },
    email: { type: 'text', selector: 'input[type="email"]:not([name*="Retype"]):not([id*="retype"]), input[name*="Email"]:not([name*="Retype"]):not([id*="retype"]), input[id*="email"]:not([id*="retype"]):not([name*="Retype"])' },
    bodyType: { 
      type: 'dropdown', 
      selector: 'select[name*="Body"], select[id*="bodyType"], select[placeholder*="Body"]',
      options: ['Slim', 'Average', 'Athletic', 'Heavy', 'Other']
    },
    physicalStatus: { type: 'text', selector: 'input[name*="Physical"], input[id*="physical"], input[placeholder*="Physical"]' },
    drinkingHabit: { type: 'text', selector: 'input[name*="Drinking"], input[id*="drinking"], input[placeholder*="Drinking"]' },
    familyValue: { 
      type: 'dropdown', 
      selector: 'select[name*="FamilyValue"], select[id*="familyValue"], select[placeholder*="FamilyValue"]',
      options: ['Traditional', 'Moderate', 'Liberal', 'Other']
    },
    familyStatus: { type: 'text', selector: 'input[name*="Family Status"], input[id*="familyStatus"], input[placeholder*="Family Status"]' },
    aboutParentsSiblings: { type: 'text', selector: 'textarea[name*="Parents"], textarea[id*="parents"], input[name*="Parents"], input[placeholder*="Parents"]' },
    yourExpectation: { type: 'text', selector: 'textarea[name*="Expectation"], textarea[id*="expectation"], input[name*="Expectation"], input[placeholder*="Expectation"]' },
    retypePassword: { type: 'text', selector: 'input[name*="Retype Password"], input[id*="retypePassword"], input[type="password"][name*="retype"]' },
    
    // Right column fields
    gender: { type: 'text', selector: 'input[name*="Gender"], input[id*="gender"], input[placeholder*="Gender"]' },
    maritalStatus: { type: 'text', selector: 'input[name*="Marital"], input[id*="marital"], input[placeholder*="Marital"]' },
    educationDetail: { type: 'text', selector: 'input[name*="Education Detail"], input[id*="educationDetail"], input[placeholder*="Education Detail"]' },
    religion: { 
      type: 'dropdown', 
      selector: 'select[name*="Religion"], select[id*="religion"], select[placeholder*="Religion"]',
      options: ['Hindu', 'Muslim', 'Christian', 'Sikh', 'Buddhist', 'Jain', 'Other']
    },
    subCaste: { type: 'text', selector: 'input[name*="Sub Caste"], input[id*="subCaste"], input[placeholder*="Sub Caste"]' },
    motherTongue: { type: 'text', selector: 'input[name*="Mother Tongue"], input[id*="motherTongue"], input[placeholder*="Mother Tongue"]' },
    star: { 
      type: 'dropdown', 
      selector: 'select[name*="Star"], select[id*="star"], select[placeholder*="Star"]',
      options: ['Aswini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra', 'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni', 'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshta', 'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha', 'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati', 'Other']
    },
    dhoshamManglik: { 
      type: 'dropdown', 
      selector: 'select[name*="Dosham"], select[name*="Dhosham"], select[id*="dosham"], select[placeholder*="Dosham"]',
      options: ['Yes', 'No', 'Other']
    },
    heightCms: { type: 'text', selector: 'input[name*="Height Cms"], input[id*="heightCms"], input[placeholder*="Height Cms"]' },
    weightKg: { type: 'text', selector: 'input[name*="Weight Kg"], input[id*="weightKg"], input[placeholder*="Weight Kg"]' },
    citizenship: { 
      type: 'dropdown', 
      selector: 'select[name*="Citizenship"], select[id*="citizenship"], select[placeholder*="Citizenship"]',
      options: ['Indian', 'USA', 'UK', 'Canada', 'Australia', 'Other']
    },
    stateCityLivingIn: { type: 'text', selector: 'input[name*="State City"], input[id*="stateCity"], input[placeholder*="State City"]' },
    retypeEmail: { type: 'text', selector: 'input[name*="Retype Email"], input[id*="retypeEmail"], input[type="email"][name*="retype"]' },
    complexion: { type: 'text', selector: 'input[name*="Complexion"], input[id*="complexion"], input[placeholder*="Complexion"]' },
    eatingHabit: { 
      type: 'dropdown', 
      selector: 'select[name*="Eating"], select[id*="eatingHabit"], select[placeholder*="Eating"]',
      options: ['Vegetarian', 'Non-Vegetarian', 'Vegan', 'Eggetarian', 'Other']
    },
    smokingHabit: { 
      type: 'dropdown', 
      selector: 'select[name*="Smoking"], select[id*="smokingHabit"], select[placeholder*="Smoking"]',
      options: ['Never', 'Occasionally', 'Regularly', 'Other']
    },
    familyType: { type: 'text', selector: 'input[name*="Family Type"], input[id*="familyType"], input[placeholder*="Family Type"]' },
    annualIncome: { type: 'text', selector: 'input[name*="Annual Income"], input[id*="annualIncome"], input[placeholder*="Annual Income"]' },
    moreAboutSelf: { type: 'text', selector: 'textarea#moreAboutSelf, textarea[id="moreAboutSelf"], textarea[name="moreAboutSelf"], textarea[name*="More About"], textarea[id*="moreAbout"], input[name*="More About"], input[placeholder*="More About"]' },
    password: { type: 'text', selector: 'input#password[type="password"], input[type="password"][id="password"], input[type="password"][name="password"], input[type="password"][name*="Password"]:not([name*="Retype"]), input[type="password"][id*="password"]:not([id*="retype"])' },
    howToKnowAboutUs: { type: 'text', selector: 'input[name*="How To Know"], input[id*="howToKnow"], input[placeholder*="How To Know"]' }
  };
}

function generateDynamicFields(data) {
  const dynamic = {};
  
  // Generate email: FormNumber_Name@nitresearchcenter.com (with underscores)
  if (data.formNumber && data.name) {
    const nameClean = data.name.replace(/\s+/g, '_'); // Use underscores instead of removing spaces
    dynamic.email = `${data.formNumber}_${nameClean}@nitresearchcenter.com`;
    dynamic.retypeEmail = dynamic.email;
  }
  
  // Generate password: FirstName@1234
  if (data.name) {
    const firstName = data.name.split(' ')[0];
    dynamic.password = `${firstName}@1234`;
    dynamic.retypePassword = dynamic.password;
  }
  
  // Set default value
  dynamic.howToKnowAboutUs = 'My Friend';
  
  // Map Home City District and State City Living In to Home State
  if (data.homeState) {
    dynamic.homeCityDistrict = data.homeState;
    dynamic.stateCityLivingIn = data.homeState;
  }
  
  return dynamic;
}

function fillTextField(selector, value, fieldName = '') {
  const field = findField(selector);
  if (!field) {
    console.warn(`Field not found for ${fieldName || 'unknown'} with selector: ${selector}`);
    return false;
  }
  
  // Validate we're filling the right field by checking ID/name
  if (fieldName) {
    const fieldId = (field.id || '').toLowerCase();
    const fieldNameAttr = (field.name || '').toLowerCase();
    const expectedId = fieldName.toLowerCase();
    
    // For specific fields, verify we got the right one
    if (fieldName === 'name' && fieldId !== 'name' && !fieldNameAttr.includes('name')) {
      console.warn(`Warning: name field selector may have matched wrong field. ID: ${field.id}, Name: ${field.name}`);
    }
    if (fieldName === 'moreAboutSelf' && fieldId !== 'moreaboutself' && !fieldNameAttr.includes('more') && !fieldNameAttr.includes('about')) {
      console.warn(`Warning: moreAboutSelf field selector may have matched wrong field. ID: ${field.id}, Name: ${field.name}`);
    }
  }
  
  // Set the value
  field.value = value;
  
  // For password fields, also try setting the value property directly
  if (field.type === 'password') {
    // Try multiple methods to set password field
    field.setAttribute('value', value);
    Object.defineProperty(field, 'value', {
      value: value,
      writable: true
    });
    field.value = value;
  }
  
  // Trigger events to ensure form validation
  field.dispatchEvent(new Event('input', { bubbles: true }));
  field.dispatchEvent(new Event('change', { bubbles: true }));
  field.dispatchEvent(new Event('blur', { bubbles: true }));
  
  // Also try focus/blur to trigger any validation
  field.focus();
  field.blur();
  
  // Verify the value was set
  if (field.value !== value && field.type !== 'password') {
    console.warn(`Value mismatch for ${fieldName}: expected "${value}", got "${field.value}"`);
  }
  
  return true;
}

function fillDropdownField(selector, value, options = []) {
  const dropdown = findField(selector);
  if (!dropdown) return false;
  
  // Try exact match first
  const exactMatch = Array.from(dropdown.options).find(opt => 
    opt.text.trim().toLowerCase() === value.toLowerCase() ||
    opt.value.toLowerCase() === value.toLowerCase()
  );
  
  if (exactMatch) {
    dropdown.value = exactMatch.value;
    dropdown.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }
  
  // Try partial match
  const partialMatch = Array.from(dropdown.options).find(opt => 
    opt.text.toLowerCase().includes(value.toLowerCase()) ||
    value.toLowerCase().includes(opt.text.toLowerCase())
  );
  
  if (partialMatch) {
    dropdown.value = partialMatch.value;
    dropdown.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }
  
  // Try to find "Other" option
  const otherOption = Array.from(dropdown.options).find(opt => 
    opt.text.toLowerCase().includes('other')
  );
  
  if (otherOption) {
    dropdown.value = otherOption.value;
    dropdown.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }
  
  return false;
}

function findField(selector) {
  // Try multiple selector strategies - exact IDs first, then broader matches
  const selectors = selector.split(',').map(s => s.trim());
  
  // First pass: try exact ID matches (most reliable)
  for (const sel of selectors) {
    try {
      // Check if this is an ID selector
      if (sel.includes('#') || sel.includes('[id=')) {
        const field = document.querySelector(sel);
        if (field && (field.offsetParent !== null || field.type === 'hidden')) {
          return field;
        }
      }
    } catch (e) {
      // Invalid selector, continue
    }
  }
  
  // Second pass: try all selectors
  for (const sel of selectors) {
    try {
      const field = document.querySelector(sel);
      if (field && (field.offsetParent !== null || field.type === 'hidden')) {
        return field;
      }
    } catch (e) {
      // Invalid selector, continue
    }
  }
  
  // Fallback: search by label text (but be very specific to avoid wrong matches)
  const labels = document.querySelectorAll('label');
  for (const label of labels) {
    const labelText = label.textContent.toLowerCase().trim();
    
    // Extract the key field name from selector
    const fieldNameMatch = selector.match(/#(\w+)|id="(\w+)"|id\*="(\w+)"|name\*="(\w+)"|placeholder\*="(\w+)"/i);
    if (fieldNameMatch) {
      const fieldName = (fieldNameMatch[1] || fieldNameMatch[2] || fieldNameMatch[3] || fieldNameMatch[4] || fieldNameMatch[5]).toLowerCase();
      
      // For critical fields, be very strict
      if (fieldName === 'name') {
        // Only match if label is exactly "Name" or starts with "Name"
        if (labelText === 'name' || labelText.startsWith('name ')) {
          const forAttr = label.getAttribute('for');
          if (forAttr) {
            const field = document.getElementById(forAttr);
            if (field && field.id === 'name') return field;
          }
        }
      } else if (fieldName === 'moreaboutself' || fieldName === 'moreabout') {
        // Only match if label contains "More About" or "More About Self"
        if (labelText.includes('more about self') || labelText.includes('more about')) {
          const forAttr = label.getAttribute('for');
          if (forAttr) {
            const field = document.getElementById(forAttr);
            if (field && (field.id === 'moreAboutSelf' || field.id.includes('moreAbout'))) return field;
          }
        }
      } else {
        // For other fields, check if label text contains the field name (but be specific)
        if (labelText.includes(fieldName) && labelText.length < 50) {
          const forAttr = label.getAttribute('for');
          if (forAttr) {
            const field = document.getElementById(forAttr);
            if (field) return field;
          }
          // Try finding input near label
          const parent = label.parentElement;
          if (parent) {
            const input = parent.querySelector('input, select, textarea');
            if (input) return input;
          }
        }
      }
    }
  }
  
  return null;
}

function waitForForm() {
  return new Promise((resolve) => {
    if (document.readyState === 'complete') {
      // Try to find at least one form field
      const hasFields = document.querySelectorAll('input, select, textarea').length > 0;
      if (hasFields) {
        resolve();
        return;
      }
    }
    
    // Wait for form to load
    const checkInterval = setInterval(() => {
      const hasFields = document.querySelectorAll('input, select, textarea').length > 0;
      if (hasFields) {
        clearInterval(checkInterval);
        resolve();
      }
    }, 100);
    
    // Timeout after 5 seconds
    setTimeout(() => {
      clearInterval(checkInterval);
      resolve();
    }, 5000);
  });
}

function triggerChangeEvents() {
  // Trigger events on all filled fields
  const fields = document.querySelectorAll('input, select, textarea');
  fields.forEach(field => {
    if (field.value) {
      field.dispatchEvent(new Event('input', { bubbles: true }));
      field.dispatchEvent(new Event('change', { bubbles: true }));
      field.dispatchEvent(new Event('blur', { bubbles: true }));
    }
  });
}

