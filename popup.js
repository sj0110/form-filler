// Popup script for handling PDF upload and form filling

let extractedData = null;
let pdfFile = null;

// Initialize PDF.js when popup loads
function initializePDFjs() {
  if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL('lib/pdf.worker.min.js');
    return true;
  }
  return false;
}

// Wait for PDF.js to load
window.addEventListener('load', () => {
  if (!initializePDFjs()) {
    // Retry after a short delay if PDF.js isn't loaded yet
    setTimeout(() => {
      initializePDFjs();
    }, 100);
  }
});

// Initialize immediately if already loaded
initializePDFjs();

document.getElementById('pdf-upload').addEventListener('change', handleFileUpload);
document.getElementById('fill-form-btn').addEventListener('click', handleFillForm);
document.getElementById('clear-btn').addEventListener('click', handleClear);

async function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  if (file.type !== 'application/pdf') {
    showStatus('Please upload a PDF file', 'error');
    return;
  }

  pdfFile = file;
  showStatus('Parsing PDF...', 'info');
  showProgress(30);

  try {
    // Read file as array buffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Parse PDF directly in popup (has DOM access)
    const data = await parsePDF(arrayBuffer);
    
    extractedData = data;
    showStatus('PDF parsed successfully!', 'success');
    showProgress(100);
    
    // Update UI
    document.getElementById('upload-text').textContent = file.name;
    document.getElementById('file-info').textContent = `File: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`;
    document.getElementById('file-info').classList.remove('hidden');
    document.getElementById('fill-form-btn').disabled = false;
    
    // Show preview
    document.getElementById('data-preview').textContent = JSON.stringify(extractedData, null, 2);
    document.getElementById('extracted-data').classList.remove('hidden');
  } catch (error) {
    console.error('Error parsing PDF:', error);
    showStatus(`Error: ${error.message}`, 'error');
    showProgress(0);
    pdfFile = null;
  }
}

async function parsePDF(arrayBuffer) {
  try {
    // Ensure PDF.js is loaded
    if (typeof pdfjsLib === 'undefined') {
      throw new Error('PDF.js library not loaded');
    }
    
    // Set worker source
    pdfjsLib.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL('lib/pdf.worker.min.js');
    
    // Load PDF
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    // Extract text from all pages
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += pageText + '\n';
    }
    
    // Parse structured data from text
    const extractedData = extractStructuredData(fullText);
    
    return extractedData;
  } catch (error) {
    console.error('PDF parsing error:', error);
    throw new Error(`Failed to parse PDF: ${error.message}`);
  }
}

function extractStructuredData(text) {
  const data = {};
  
  // Normalize text - replace multiple spaces with single space
  text = text.replace(/\s+/g, ' ').trim();
  
  // Define field mappings with their possible label variations
  const fieldMappings = {
    formNumber: ['Form Number', 'FormNumber'],
    name: ['Name'],
    gender: ['Gender'],
    age: ['Age'],
    maritalStatus: ['Marital Status', 'MaritalStatus'],
    education: ['Education'],
    educationDetail: ['Education Detail', 'EducationDetail'],
    occupation: ['Occupation'],
    religion: ['Religion'],
    caste: ['Caste'],
    subCaste: ['Sub Caste', 'SubCaste'],
    gothram: ['Gothram', 'Gothra'],
    motherTongue: ['Mother Tongue', 'MotherTongue'],
    horoscopeMatch: ['Horoscope Match', 'HoroscopeMatch'],
    star: ['Star'],
    rassiMoonSign: ['Rassi / Moon Sign', 'Rassi', 'Raasi Moon Sign', 'RaasiMoonSign'],
    dhoshamManglik: ['Dhosham / Magalik', 'Dhosham', 'Dosham Manglik', 'DoshamManglik'],
    height: ['Height'],
    weight: ['Weight'],
    citizenship: ['Citizenship'],
    homeState: ['Home State', 'HomeState'],
    countryLivingIn: ['Country Living in', 'Country Living In', 'CountryLivingIn'],
    bodyType: ['Body Type', 'BodyType'],
    eatingHabit: ['Eating Habit', 'EatingHabit'],
    complexion: ['Complexion'],
    physicalStatus: ['Physical Status', 'PhysicalStatus'],
    smokingHabit: ['Smoking Habit', 'SmokingHabit'],
    drinkingHabit: ['Drinking Habit', 'DrinkingHabit'],
    familyValue: ['Family Value', 'FamilyValue'],
    familyType: ['Family Type', 'FamilyType'],
    familyStatus: ['Family Status', 'FamilyStatus'],
    annualIncome: ['Annual Income', 'AnnualIncome']
  };
  
  // Find all field label positions in the text (only first occurrence of each unique label)
  const findFieldPositions = () => {
    const positions = [];
    const seenLabels = new Set();
    const allLabels = Object.values(fieldMappings).flat();
    
    // Create a map of label -> first position
    const labelPositions = new Map();
    
    for (const label of allLabels) {
      if (seenLabels.has(label)) continue;
      seenLabels.add(label);
      
      const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // Use word boundary for single words, but for multi-word labels, match the whole phrase
      const regex = label.includes(' ') 
        ? new RegExp(`${escapedLabel.replace(/\s+/g, '\\s+')}:\\s*`, 'i')
        : new RegExp(`\\b${escapedLabel}:\\s*`, 'i');
      
      const match = text.match(regex);
      if (match) {
        labelPositions.set(label, {
          label: label,
          index: match.index,
          endIndex: match.index + match[0].length
        });
      }
    }
    
    // Convert to array and sort by position
    return Array.from(labelPositions.values()).sort((a, b) => a.index - b.index);
  };
  
  const positions = findFieldPositions();
  
  // Helper to extract value between two positions
  const extractValue = (startIndex, endIndex) => {
    if (endIndex === -1 || endIndex > text.length) {
      return text.substring(startIndex).trim();
    }
    return text.substring(startIndex, endIndex).trim();
  };
  
  // Extract each field by finding its label and stopping at the next label
  for (const [key, labels] of Object.entries(fieldMappings)) {
    if (data[key]) continue; // Already extracted
    
    for (const label of labels) {
      // Find this label's position
      const labelPos = positions.find(p => p.label === label);
      
      if (labelPos) {
        const startIndex = labelPos.endIndex;
        
        // Find the next field label after this one
        let endIndex = text.length;
        for (const pos of positions) {
          if (pos.index > startIndex) {
            endIndex = pos.index;
            break;
          }
        }
        
        const value = extractValue(startIndex, endIndex);
        if (value) {
          data[key] = value;
          break; // Found a match, move to next field
        }
      }
    }
  }
  
  // Special handling for multi-line text fields (extract separately to avoid conflicts)
  const moreAboutMatch = text.match(/More About Self[:\s]+(.*?)(?=\s*(?:Your Expectation|About Parents Siblings)|$)/is);
  if (moreAboutMatch) {
    data.moreAboutSelf = moreAboutMatch[1].trim();
  }
  
  const expectationMatch = text.match(/Your Expectation[:\s]+(.*?)(?=\s*About Parents Siblings|$)/is);
  if (expectationMatch) {
    data.yourExpectation = expectationMatch[1].trim();
  }
  
  const parentsMatch = text.match(/About Parents Siblings[:\s]+(.*?)$/is);
  if (parentsMatch) {
    data.aboutParentsSiblings = parentsMatch[1].trim();
  }
  
  // Parse height (format: 6'7" or similar)
  if (data.height) {
    const heightMatch = data.height.match(/(\d+)'(\d+)"/);
    if (heightMatch) {
      data.heightFeet = String(heightMatch[1]);
      data.heightInches = String(heightMatch[2]);
      // Convert to cm (approximate)
      const totalInches = parseInt(heightMatch[1]) * 12 + parseInt(heightMatch[2]);
      data.heightCms = String(Math.round(totalInches * 2.54));
    }
  }
  
  // Parse weight (format: 84 kg or similar)
  if (data.weight) {
    const weightKgMatch = data.weight.match(/(\d+)\s*kg/i);
    const weightLbsMatch = data.weight.match(/(\d+)\s*lbs?/i);
    if (weightKgMatch) {
      data.weightKg = String(weightKgMatch[1]);
      data.weightLbs = String(Math.round(parseInt(weightKgMatch[1]) * 2.20462));
    } else if (weightLbsMatch) {
      data.weightLbs = String(weightLbsMatch[1]);
      data.weightKg = String(Math.round(parseInt(weightLbsMatch[1]) / 2.20462));
    }
  }
  
  return data;
}

async function handleFillForm() {
  if (!extractedData) {
    showStatus('Please upload a PDF first', 'error');
    return;
  }

  showStatus('Filling form...', 'info');
  showProgress(50);

  try {
    // Get active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab.url.includes('hrnextgeninfohub.com')) {
      showStatus('Please navigate to the form page', 'error');
      return;
    }

    // Ensure content script is injected
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });
    } catch (e) {
      // Content script might already be injected, continue
      console.log('Content script injection:', e.message);
    }

    // Wait a bit for script to be ready
    await new Promise(resolve => setTimeout(resolve, 500));

    // Send message to fill form
    const response = await chrome.tabs.sendMessage(tab.id, {
      action: 'fillForm',
      data: extractedData
    });

    if (response && response.success) {
      const result = response.result;
      const filledCount = result.filled.length;
      const errorCount = result.errors.length;
      const skippedCount = result.skipped.length;
      
      if (errorCount === 0) {
        showStatus(`Form filled successfully! (${filledCount} fields)`, 'success');
      } else {
        showStatus(`Form filled with ${filledCount} fields. ${errorCount} errors, ${skippedCount} skipped.`, 'info');
      }
      showProgress(100);
      
      // Close popup after 3 seconds
      setTimeout(() => {
        window.close();
      }, 3000);
    } else {
      throw new Error(response?.error || 'Failed to fill form');
    }
  } catch (error) {
    console.error('Error filling form:', error);
    showStatus(`Error: ${error.message}`, 'error');
    showProgress(0);
  }
}

function handleClear() {
  extractedData = null;
  pdfFile = null;
  document.getElementById('pdf-upload').value = '';
  document.getElementById('upload-text').textContent = 'Upload PDF';
  document.getElementById('file-info').classList.add('hidden');
  document.getElementById('fill-form-btn').disabled = true;
  document.getElementById('extracted-data').classList.add('hidden');
  document.getElementById('status-message').classList.remove('success', 'error', 'info');
  showProgress(0);
}

function showStatus(message, type) {
  const statusEl = document.getElementById('status-message');
  statusEl.textContent = message;
  statusEl.className = `status-message ${type}`;
}

function showProgress(percent) {
  const progressBar = document.getElementById('progress-bar');
  const progressFill = document.getElementById('progress-fill');
  
  if (percent > 0) {
    progressBar.classList.remove('hidden');
    progressFill.style.width = `${percent}%`;
  } else {
    progressBar.classList.add('hidden');
  }
}

