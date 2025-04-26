document.addEventListener('DOMContentLoaded', function() {
    // Form validation
    const downloadForm = document.getElementById('downloadForm');
    if (downloadForm) {
      downloadForm.addEventListener('submit', function(e) {
        const urlInput = document.getElementById('url');
        if (!urlInput.value.match(/^https?:\/\//)) {
          e.preventDefault();
          alert('Please enter a valid URL starting with http:// or https://');
          urlInput.focus();
        }
      });
    }
  
    // Service Worker Registration
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(registration => {
          console.log('ServiceWorker registration successful');
        }).catch(err => {
          console.log('ServiceWorker registration failed: ', err);
        });
      });
    }
  
    // Progressive enhancement for form submission
    const enhanceForms = () => {
      const forms = document.querySelectorAll('form[method="post"]');
      forms.forEach(form => {
        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          
          const submitButton = form.querySelector('button[type="submit"]');
          const originalText = submitButton.textContent;
          submitButton.disabled = true;
          submitButton.textContent = 'Processing...';
          
          try {
            const formData = new FormData(form);
            const response = await fetch(form.action, {
              method: 'POST',
              body: formData
            });
            
            if (response.redirected) {
              window.location.href = response.url;
            } else {
              const result = await response.json();
              if (result.error) {
                showError(result.error);
              } else if (result.success) {
                window.location.href = result.redirect || '/';
              }
            }
          } catch (error) {
            showError('An error occurred. Please try again.');
          } finally {
            submitButton.disabled = false;
            submitButton.textContent = originalText;
          }
        });
      });
    };
  
    // Error display function
    const showError = (message) => {
      const errorDiv = document.createElement('div');
      errorDiv.className = 'error-message';
      errorDiv.textContent = message;
      errorDiv.style.color = '#e53e3e';
      errorDiv.style.marginTop = '1rem';
      errorDiv.style.padding = '0.5rem';
      errorDiv.style.border = '1px solid #fed7d7';
      errorDiv.style.borderRadius = '4px';
      errorDiv.style.backgroundColor = '#fff5f5';
      
      const form = document.querySelector('form');
      form.appendChild(errorDiv);
      
      setTimeout(() => {
        errorDiv.remove();
      }, 5000);
    };
  
    enhanceForms();
  });