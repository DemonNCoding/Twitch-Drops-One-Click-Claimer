const claimButton = document.getElementById('claimButton');
const statusLabel = document.getElementById('statusLabel');
const statusMessage = document.getElementById('statusMessage');
const count = document.getElementById('count');
const buttonText = document.getElementById('buttonText');
const buttonIcon = document.getElementById('buttonIcon');

// Check if we're on the right page and count available drops
async function checkDropsAvailable() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab.url.includes('twitch.tv/drops/inventory')) {
      statusLabel.textContent = 'Not on Drops page';
      statusMessage.textContent = 'Click button to navigate';
      statusMessage.className = 'status-message status-warning';
      count.textContent = '—';
      claimButton.disabled = false;
      buttonText.textContent = 'Go to Drops Inventory';
      buttonIcon.textContent = '🔗';
      return;
    }

    const result = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: countClaimButtons
    });

    const dropsCount = result[0].result;
    count.textContent = dropsCount;
    
    if (dropsCount === 0) {
      statusLabel.textContent = 'No drops available';
      statusMessage.textContent = 'Check back later for new drops';
      statusMessage.className = 'status-message';
      claimButton.disabled = true;
      buttonText.textContent = 'No Drops to Claim';
      buttonIcon.textContent = '✓';
    } else {
      statusLabel.textContent = 'Available Drops';
      statusMessage.textContent = 'Ready to claim';
      statusMessage.className = 'status-message';
      claimButton.disabled = false;
      buttonText.textContent = 'Claim All Drops';
      buttonIcon.textContent = '🎯';
    }
  } catch (error) {
    console.error('Error checking drops:', error);
    statusLabel.textContent = 'Error';
    statusMessage.textContent = 'Could not check page';
    statusMessage.className = 'status-message status-error';
    count.textContent = '—';
  }
}

// Function to count claim buttons on the page
function countClaimButtons() {
  const buttons = document.querySelectorAll('[data-a-target="tw-core-button-label-text"]');
  let claimCount = 0;
  
  buttons.forEach(button => {
    if (button.textContent.trim() === 'Claim Now') {
      claimCount++;
    }
  });
  
  return claimCount;
}

// Function to click all claim buttons
function clickAllClaimButtons() {
  const buttons = document.querySelectorAll('[data-a-target="tw-core-button-label-text"]');
  let claimed = 0;
  
  buttons.forEach(button => {
    if (button.textContent.trim() === 'Claim Now') {
      // Find the parent button element and click it
      const parentButton = button.closest('button');
      if (parentButton) {
        setTimeout(() => {
          parentButton.click();
        }, claimed * 200); // Stagger clicks by 200ms to avoid issues
        claimed++;
      }
    }
  });
  
  return claimed;
}

// Handle claim button click
claimButton.addEventListener('click', async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab.url.includes('twitch.tv/drops/inventory')) {
      // Navigate to the drops inventory page
      await chrome.tabs.update(tab.id, { url: 'https://www.twitch.tv/drops/inventory' });
      statusLabel.textContent = 'Navigating...';
      statusMessage.textContent = 'Taking you to drops inventory';
      statusMessage.className = 'status-message';
      buttonText.textContent = 'Loading...';
      buttonIcon.textContent = '⏳';
      setTimeout(() => {
        window.close();
      }, 1000);
      return;
    }

    // Disable button and show loading
    claimButton.disabled = true;
    buttonIcon.innerHTML = '<span class="circular-progress"></span>';
    buttonText.textContent = 'Claiming...';
    statusLabel.textContent = 'In Progress';
    statusMessage.textContent = 'Claiming your drops...';
    statusMessage.className = 'status-message';

    // Execute the claim function
    const result = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: clickAllClaimButtons
    });

    const claimedCount = result[0].result;

    // Update UI with success message
    if (claimedCount > 0) {
      statusLabel.textContent = 'Success!';
      statusMessage.textContent = `Claimed ${claimedCount} drop${claimedCount > 1 ? 's' : ''}`;
      statusMessage.className = 'status-message status-success';
      count.textContent = claimedCount;
      buttonText.textContent = 'Claimed!';
      buttonIcon.textContent = '✅';
      
      // Wait for all clicks to complete (200ms per claim + 1 second buffer) then refresh
      const totalTime = (claimedCount * 200) + 1000;
      setTimeout(async () => {
        await chrome.tabs.reload(tab.id);
        window.close();
      }, totalTime);
    } else {
      statusLabel.textContent = 'No drops found';
      statusMessage.textContent = 'Try refreshing the page';
      statusMessage.className = 'status-message status-warning';
      buttonText.textContent = 'Claim All Drops';
      buttonIcon.textContent = '🎯';
      claimButton.disabled = false;
    }

  } catch (error) {
    console.error('Error claiming drops:', error);
    statusLabel.textContent = 'Error';
    statusMessage.textContent = 'Failed to claim drops';
    statusMessage.className = 'status-message status-error';
    buttonText.textContent = 'Try Again';
    buttonIcon.textContent = '↻';
    claimButton.disabled = false;
  }
});

// Check for available drops when popup opens
checkDropsAvailable();
