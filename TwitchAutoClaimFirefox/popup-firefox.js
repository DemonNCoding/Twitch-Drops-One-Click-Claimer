const claimButton = document.getElementById('claimButton');
const statusText = document.getElementById('statusText');
const count = document.getElementById('count');
const buttonText = document.getElementById('buttonText');

// Check if we're on the right page and count available drops
async function checkDropsAvailable() {
  try {
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    
    if (!tabs || tabs.length === 0) {
      statusText.textContent = 'Cannot access tab';
      count.textContent = '❌';
      claimButton.disabled = true;
      return;
    }
    
    const tab = tabs[0];
    
    if (!tab.url || !tab.url.includes('twitch.tv/drops/inventory')) {
      statusText.textContent = 'Navigate to Drops Inventory page';
      count.textContent = '⚠️';
      claimButton.disabled = true;
      return;
    }

    const result = await browser.tabs.executeScript(tab.id, {
      code: `
        (function() {
          const buttons = document.querySelectorAll('[data-a-target="tw-core-button-label-text"]');
          let claimCount = 0;
          
          buttons.forEach(button => {
            if (button.textContent.trim() === 'Claim Now') {
              claimCount++;
            }
          });
          
          return claimCount;
        })();
      `
    });

    const dropsCount = result[0];
    count.textContent = dropsCount;
    
    if (dropsCount === 0) {
      statusText.textContent = 'No drops to claim';
      claimButton.disabled = true;
    } else {
      statusText.textContent = 'Ready to claim drops';
      claimButton.disabled = false;
    }
  } catch (error) {
    console.error('Error checking drops:', error);
    statusText.textContent = 'Error checking page';
    count.textContent = '❌';
  }
}

// Handle claim button click
claimButton.addEventListener('click', async () => {
  try {
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    
    if (!tabs || tabs.length === 0) {
      statusText.textContent = 'Cannot access tab';
      statusText.className = 'status-text error';
      return;
    }
    
    const tab = tabs[0];
    
    if (!tab.url || !tab.url.includes('twitch.tv/drops/inventory')) {
      // Navigate to the drops inventory page
      await browser.tabs.update(tab.id, { url: 'https://www.twitch.tv/drops/inventory' });
      statusText.textContent = 'Navigating to drops page...';
      statusText.className = 'status-text';
      setTimeout(() => {
        window.close();
      }, 1000);
      return;
    }

    // Disable button and show loading
    claimButton.disabled = true;
    buttonText.innerHTML = '<span class="spinner"></span> Claiming...';
    statusText.textContent = 'Claiming drops...';

    // Execute the claim function
    const result = await browser.tabs.executeScript(tab.id, {
      code: `
        (function() {
          const buttons = document.querySelectorAll('[data-a-target="tw-core-button-label-text"]');
          let claimed = 0;
          
          buttons.forEach(button => {
            if (button.textContent.trim() === 'Claim Now') {
              const parentButton = button.closest('button');
              if (parentButton) {
                setTimeout(() => {
                  parentButton.click();
                }, claimed * 200);
                claimed++;
              }
            }
          });
          
          return claimed;
        })();
      `
    });

    const claimedCount = result[0];

    // Update UI with success message
    if (claimedCount > 0) {
      statusText.textContent = 'Successfully claimed!';
      statusText.className = 'status-text success';
      count.textContent = claimedCount;
      buttonText.textContent = '✅ Claimed!';
      
      // Wait for all clicks to complete (200ms per claim + 1 second buffer) then refresh
      const totalTime = (claimedCount * 200) + 1000;
      setTimeout(async () => {
        await browser.tabs.reload(tab.id);
        window.close();
      }, totalTime);
    } else {
      statusText.textContent = 'No drops found';
      buttonText.textContent = '🎯 Claim All Drops';
      claimButton.disabled = false;
    }

  } catch (error) {
    console.error('Error claiming drops:', error);
    statusText.textContent = 'Error claiming drops';
    statusText.className = 'status-text error';
    buttonText.textContent = '🎯 Claim All Drops';
    claimButton.disabled = false;
  }
});

// Check for available drops when popup opens
checkDropsAvailable();