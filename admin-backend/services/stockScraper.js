const axios = require('axios');
const cheerio = require('cheerio');

class StockScraper {
  constructor() {
    this.baseUrl = 'https://www.dsebd.org/displayCompany.php';
  }

  async fetchStockData(tradingCode) {
    try {
      const url = `${this.baseUrl}?name=${tradingCode}`;
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      
      // Extract basic company information
      const companyName = this.extractCompanyName($);
      const scripCode = this.extractScripCode($);
      const sector = this.extractSector($);

      // Extract market information
      const marketInfo = this.extractMarketInformation($);
      
      // Extract basic information
      const basicInfo = this.extractBasicInformation($);
      
      // Extract financial performance
      const financialPerformance = this.extractFinancialPerformance($);
      
      // Extract corporate actions
      const corporateActions = this.extractCorporateActions($);
      
      // Extract financial highlights
      const financialHighlights = this.extractFinancialHighlights($);
      
      // Extract shareholding information
      const shareholding = this.extractShareholding($);
      
      // Extract corporate information
      const corporateInformation = this.extractCorporateInformation($);
      
      // Extract links
      const links = this.extractLinks($, tradingCode);

      return {
        companyName,
        tradingCode,
        scripCode,
        sector,
        marketInformation: marketInfo,
        basicInformation: basicInfo,
        financialPerformance,
        corporateActions,
        financialHighlights,
        shareholding,
        corporateInformation,
        links,
        lastUpdated: new Date()
      };

    } catch (error) {
      console.error('Error fetching stock data:', error.message);
      throw new Error(`Failed to fetch data for ${tradingCode}: ${error.message}`);
    }
  }

  extractCompanyName($) {
    // Try multiple approaches to find the company name
    
    // Approach 1: Look for "Company Name:" in a td element followed by the company name
    let companyNameText = $('td:contains("Company Name:")').next().text().trim();
    
    // Approach 2: Look for text that contains "Company Name:" and extract the part after it
    if (!companyNameText || companyNameText === 'N/A') {
      const companyNameElement = $('*:contains("Company Name:")').first();
      if (companyNameElement.length > 0) {
        const fullText = companyNameElement.text();
        const match = fullText.match(/Company Name:\s*(.+?)(?:\s*Trading Code:|$)/);
        if (match && match[1]) {
          companyNameText = match[1].trim();
        }
      }
    }
    
    // Approach 3: Look for the pattern in the HTML structure based on DSE website
    if (!companyNameText || companyNameText === 'N/A') {
      // Look for elements containing "Company Name:" and extract the company name from the same element
      $('*').each((i, element) => {
        const text = $(element).text();
        if (text.includes('Company Name:') && text.includes('Trading Code:')) {
          const match = text.match(/Company Name:\s*(.+?)\s*Trading Code:/);
          if (match && match[1]) {
            companyNameText = match[1].trim();
            return false; // Break the loop
          }
        }
      });
    }
    
    // Clean up the extracted text
    if (companyNameText) {
      // Remove any trailing periods or extra whitespace
      companyNameText = companyNameText.replace(/\.$/, '').trim();
    }
    
    return companyNameText || 'N/A';
  }

  extractScripCode($) {
    // Look for scrip code in the page
    const scripCodeText = $('td:contains("Scrip Code:")').next().text().trim();
    return scripCodeText || 'N/A';
  }

  extractSector($) {
    // Find the basic information table and extract sector
    const basicTable = $('table.table-bordered').filter((i, el) => {
      return $(el).find('th:contains("Sector")').length > 0;
    });
    
    const sectorText = basicTable.find('th:contains("Sector")').next('td').text().trim();
    return sectorText || 'Unknown';
  }

  extractMarketInformation($) {
    const extractNumber = (text) => {
      if (!text) return 0;
      const cleaned = text.replace(/[^\d.-]/g, '');
      return parseFloat(cleaned) || 0;
    };

    const extractDate = (text) => {
      // Try to parse date from text
      const dateMatch = text.match(/(\w+\s+\d+,\s+\d+)/);
      if (dateMatch) {
        return new Date(dateMatch[1]);
      }
      return new Date();
    };

    // Find the market information table
    const marketTable = $('table.table-bordered').filter((i, el) => {
      return $(el).find('th:contains("Last Trading Price")').length > 0;
    });

    // Extract values using more specific selectors
    const lastTradingPrice = extractNumber(marketTable.find('th:contains("Last Trading Price")').next('td').text());
    const closingPrice = extractNumber(marketTable.find('th:contains("Closing Price")').next('td').text());
    const openingPrice = extractNumber(marketTable.find('th:contains("Opening Price")').next('td').text());
    const adjustedOpeningPrice = extractNumber(marketTable.find('th:contains("Adjusted Opening Price")').next('td').text());
    const yesterdaysClosingPrice = extractNumber(marketTable.find('th:contains("Yesterday\'s Closing Price")').next('td').text());
    
    // Extract change value (it's in a rowspan cell)
    const changeCell = marketTable.find('th:contains("Change")').next('td');
    const change = extractNumber(changeCell.text());
    
    // Extract percentage change (it's in the next row after change)
    const changePercentageCell = changeCell.parent().next('tr').find('td').first();
    const changePercentage = extractNumber(changePercentageCell.text());
    
    // Extract ranges
    const daysRangeText = marketTable.find('th:contains("Day\'s Range")').next('td').text();
    const daysRange = this.parseRange(daysRangeText);
    
    const fiftyTwoWeeksRangeText = marketTable.find('th:contains("52 Weeks\' Moving Range")').next('td').text();
    const fiftyTwoWeeksMovingRange = this.parseRange(fiftyTwoWeeksRangeText);
    
    // Extract other values
    const daysValue = extractNumber(marketTable.find('th:contains("Day\'s Value")').next('td').text());
    const daysVolume = extractNumber(marketTable.find('th:contains("Day\'s Volume")').next('td').text());
    const daysTradeCount = extractNumber(marketTable.find('th:contains("Day\'s Trade")').next('td').text());
    const marketCapitalization = extractNumber(marketTable.find('th:contains("Market Capitalization")').next('td').text());

    return {
      asOfDate: new Date(), // This should be extracted from the page
      lastTradingPrice,
      closingPrice,
      change,
      changePercentage,
      openingPrice,
      adjustedOpeningPrice,
      yesterdaysClosingPrice,
      daysRange,
      fiftyTwoWeeksMovingRange,
      daysValue: daysValue * 1000000, // Convert to actual value (mn to actual)
      daysVolume,
      daysTradeCount,
      marketCapitalization: marketCapitalization * 1000000 // Convert to actual value (mn to actual)
    };
  }

  extractBasicInformation($) {
    const extractNumber = (text) => {
      if (!text) return 0;
      const cleaned = text.replace(/[^\d.-]/g, '');
      return parseFloat(cleaned) || 0;
    };

    // Find the basic information table
    const basicTable = $('table.table-bordered').filter((i, el) => {
      return $(el).find('th:contains("Authorized Capital")').length > 0;
    });

    // Find the other information table for listing year, market category, etc.
    const otherInfoTable = $('table.table-bordered').filter((i, el) => {
      return $(el).find('td:contains("Listing Year")').length > 0;
    });

    // Extract values using more specific selectors
    const authorizedCapital = extractNumber(basicTable.find('th:contains("Authorized Capital")').next('td').text());
    const paidUpCapital = extractNumber(basicTable.find('th:contains("Paid-up Capital")').next('td').text());
    const faceValue = extractNumber(basicTable.find('th:contains("Face/par Value")').next('td').text());
    const totalOutstandingSecurities = extractNumber(basicTable.find('th:contains("Total No. of Outstanding Securities")').next('td').text());
    const typeOfInstrument = basicTable.find('th:contains("Type of Instrument")').next('td').text().trim() || 'Equity';
    const marketLot = extractNumber(basicTable.find('th:contains("Market Lot")').next('td').text()) || 1;
    const sector = basicTable.find('th:contains("Sector")').next('td').text().trim() || 'Unknown';

    // Extract from other information table
    const listingYear = extractNumber(otherInfoTable.find('td:contains("Listing Year")').next('td').text()) || 2000;
    const marketCategory = otherInfoTable.find('td:contains("Market Category")').next('td').text().trim() || 'A';
    const electronicShareText = otherInfoTable.find('td:contains("Electronic Share")').next('td').text().trim();
    const isElectronicShare = electronicShareText === 'Y' || electronicShareText === 'Yes';

    return {
      authorizedCapital: authorizedCapital * 1000000, // Convert mn to actual value
      paidUpCapital: paidUpCapital * 1000000, // Convert mn to actual value
      faceValue,
      totalOutstandingSecurities,
      typeOfInstrument,
      marketLot,
      listingYear,
      marketCategory,
      isElectronicShare
    };
  }

  extractFinancialPerformance($) {
    const extractNumber = (text) => {
      if (!text) return null;
      const cleaned = text.replace(/[^\d.-]/g, '');
      const num = parseFloat(cleaned);
      return isNaN(num) ? null : num;
    };

    console.log('Starting financial performance extraction...');

    // Find the interim financial performance table by looking for the specific heading
    let interimTable = null;
    // Find the audited financial performance table
    let auditedTable = null;
    $('h2.BodyHead').each((i, el) => {
      const headingText = $(el).text();
      console.log(`Found heading: ${headingText}`);
      if (headingText.includes('Interim Financial Performance')) {
        // Get the next table after this heading
        interimTable = $(el).next('.table-responsive').find('table.table-bordered');
        console.log(`Found interim table with ${interimTable.length} elements`);
      }
      if (headingText.includes('Financial Performance as per Audited Financial Statements')) {
        auditedTable = $(el).next('.table-responsive').find('table.table-bordered');
        console.log(`Found audited table with ${auditedTable.length} elements`);
      }
    });

    const interimEPS = [];
    const periodEndMarketPrice = [];
    const auditedEPS = [];

    if (interimTable && interimTable.length > 0) {
      console.log('Processing interim table...');
      
      // Extract EPS data - look for the first "Basic" row under "Earnings Per Share (EPS)" header
      let foundEPSHeader = false;
      interimTable.find('tr').each((i, row) => {
        const $row = $(row);
        
        // Check if this is the EPS header row
        if ($row.hasClass('header') && $row.find('td').text().includes('Earnings Per Share (EPS)') && !$row.find('td').text().includes('continuing operations')) {
          console.log('Found EPS header row');
          foundEPSHeader = true;
          return true; // Continue to next row
        }
        
        // If we found the EPS header and this row contains "Basic"
        if (foundEPSHeader && $row.find('td').first().text().trim() === 'Basic') {
          console.log('Found Basic EPS row');
          const epsCells = $row.find('td');
          epsCells.each((index, cell) => {
            if (index > 0) { // Skip the first cell which contains "Basic"
              const cellText = $(cell).text().trim();
              const value = extractNumber(cellText);
              console.log(`EPS Cell ${index}: ${cellText} -> ${value}`);
              if (value !== null && cellText !== '-') {
                const periodName = index === 1 ? 'Q1' : index === 2 ? 'Q2' : index === 3 ? 'Half Yearly' : index === 4 ? 'Q3' : index === 5 ? '9 Months' : 'Annual';
                interimEPS.push({
                  year: 2025, // Default year, should be extracted from table headers
                  period: periodName,
                  endingOn: new Date(), // Default date, should be extracted from table headers
                  basic: value,
                  diluted: null
                });
              }
            }
          });
          foundEPSHeader = false; // Reset to avoid processing continuing operations
          return false; // Break after processing the first Basic row
        }
      });

      // Extract market price per share at period end
      const marketPriceRow = interimTable.find('td:contains("Market price per share at period end")').parent();
      console.log(`Found market price row: ${marketPriceRow.length}`);
      if (marketPriceRow.length > 0) {
        const priceCells = marketPriceRow.find('td');
        priceCells.each((index, cell) => {
          if (index > 0) { // Skip the first cell which contains the label
            const cellText = $(cell).text().trim();
            const value = extractNumber(cellText);
            console.log(`Price Cell ${index}: ${cellText} -> ${value}`);
            if (value !== null && cellText !== '-') {
              const periodName = index === 1 ? 'Q1' : index === 2 ? 'Q2' : index === 3 ? 'Half Yearly' : index === 4 ? 'Q3' : index === 5 ? '9 Months' : 'Annual';
              periodEndMarketPrice.push({
                period: periodName,
                price: value
              });
            }
          }
        });
      }
    } else {
      console.log('No interim table found');
    }

    // Parse audited EPS: Year and EPS (Continuing Ops Basic - Original) per row
    if (auditedTable && auditedTable.length > 0) {
      try {
        auditedTable.find('tr').each((i, row) => {
          const $row = $(row);
          if ($row.hasClass('header')) return; // skip headers
          // Only parse data rows (class 'shrink' or 'alt')
          const cells = $row.find('td');
          if (cells.length >= 8) {
            const yearText = $(cells[0]).text().trim();
            const yearMatch = yearText.match(/\b(20\d{2})\b/);
            if (!yearMatch) return;
            const year = parseInt(yearMatch[1], 10);
            // Column mapping after year cell:
            // 1: EPS Basic Original, 2: EPS Basic Restated, 3: EPS Basic Diluted,
            // 4: EPS CO Basic Original (target), 5: EPS CO Restated, 6: EPS CO Diluted
            const epsText = $(cells[4]).text().trim();
            const epsVal = extractNumber(epsText);
            auditedEPS.push({ year, eps: epsVal });
          }
        });
      } catch (e) {
        console.log('Error parsing audited EPS:', e.message);
      }
    } else {
      console.log('No audited table found');
    }

    console.log(`Final EPS data: ${JSON.stringify(interimEPS)}`);
    console.log(`Final market price data: ${JSON.stringify(periodEndMarketPrice)}`);
    console.log(`Final audited EPS data: ${JSON.stringify(auditedEPS)}`);

    return {
      interimEPS,
      periodEndMarketPrice,
      auditedEPS
    };
  }

  extractCorporateActions($) {
    const parseDividendData = (text) => {
      if (!text) return [];
      
      // Parse dividend data like "5% 2023, 5% 2022, 5% 2021, 5% 2020, 5% 2019, 20% 2016, 15% 2015"
      const dividends = [];
      const matches = text.match(/(\d+(?:\.\d+)?)%\s*(\d{4})/g);
      
      if (matches) {
        matches.forEach(match => {
          const [, percentage, year] = match.match(/(\d+(?:\.\d+)?)%\s*(\d{4})/);
          dividends.push({
            year: parseInt(year),
            percentage: parseFloat(percentage)
          });
        });
      }
      
      return dividends;
    };

    const parseBonusData = (text) => {
      if (!text) return [];
      
      // Parse bonus data like "5% 2023, 5% 2022, 5% 2021, 10% 2018, 1.7B:10 2007, 1B:2 2003"
      const bonuses = [];
      
      // Handle percentage format (e.g., "5% 2023")
      const percentageMatches = text.match(/(\d+(?:\.\d+)?)%\s*(\d{4})/g);
      if (percentageMatches) {
        percentageMatches.forEach(match => {
          const [, percentage, year] = match.match(/(\d+(?:\.\d+)?)%\s*(\d{4})/);
          bonuses.push({
            year: parseInt(year),
            percentage: parseFloat(percentage)
          });
        });
      }
      
      // Handle ratio format (e.g., "1.7B:10 2007", "1B:2 2003") - convert to percentage
      const ratioMatches = text.match(/(\d+(?:\.\d+)?B?):(\d+)\s*(\d{4})/g);
      if (ratioMatches) {
        ratioMatches.forEach(match => {
          const [, numerator, denominator, year] = match.match(/(\d+(?:\.\d+)?B?):(\d+)\s*(\d{4})/);
          const numValue = parseFloat(numerator.replace('B', ''));
          const denValue = parseFloat(denominator);
          const percentage = (numValue / denValue) * 100;
          bonuses.push({
            year: parseInt(year),
            percentage: percentage
          });
        });
      }
      
      return bonuses;
    };

    const parseRightData = (text) => {
      if (!text) return [];
      
      // Parse right issue data like "1R:1 2011, 1R:1 2007"
      const rights = [];
      const matches = text.match(/(\d+R:\d+)\s*(\d{4})/g);
      
      if (matches) {
        matches.forEach(match => {
          const [, ratio, year] = match.match(/(\d+R:\d+)\s*(\d{4})/);
          rights.push({
            year: parseInt(year),
            ratio: ratio
          });
        });
      }
      
      return rights;
    };

    // Find the corporate actions table
    const corporateTable = $('table.table-bordered').filter((i, el) => {
      return $(el).find('th:contains("Cash Dividend")').length > 0;
    });

    let cashDividends = [];
    let bonusIssues = [];
    let rightIssues = [];
    let lastAGMDate = new Date();
    let forYearEnded = new Date();

    if (corporateTable.length > 0) {
      // Extract cash dividends
      const cashDividendText = corporateTable.find('th:contains("Cash Dividend")').next('td').text().trim();
      cashDividends = parseDividendData(cashDividendText);

      // Extract bonus issues
      const bonusIssueText = corporateTable.find('th:contains("Bonus Issue")').next('td').text().trim();
      bonusIssues = parseBonusData(bonusIssueText);

      // Extract right issues
      const rightIssueText = corporateTable.find('th:contains("Right Issue")').next('td').text().trim();
      rightIssues = parseRightData(rightIssueText);
    }

    return {
      lastAGMDate,
      forYearEnded,
      cashDividends,
      bonusIssues,
      rightIssues
    };
  }

  extractFinancialHighlights($) {
    const extractNumber = (text) => {
      if (!text) return 0;
      const cleaned = text.replace(/[^\d.-]/g, '');
      return parseFloat(cleaned) || 0;
    };

    // Find the loan status section
    let shortTermLoan = 0;
    let longTermLoan = 0;
    let asOnDate = new Date();

    // Look for the "Present Loan Status" header
    const loanStatusHeader = $('td:contains("Present Loan Status")');
    if (loanStatusHeader.length > 0) {
      // Extract the date from the header text
      const headerText = loanStatusHeader.text();
      const dateMatch = headerText.match(/(\w+\s+\d+,\s+\d+)/);
      if (dateMatch) {
        asOnDate = new Date(dateMatch[1]);
      }

      // Find the table containing the loan status
      const loanTable = loanStatusHeader.closest('table');
      
      // Extract short-term loan
      const shortTermRow = loanTable.find('td:contains("Short-term loan")');
      if (shortTermRow.length > 0) {
        const shortTermValue = shortTermRow.next('td').text().trim();
        shortTermLoan = extractNumber(shortTermValue);
      }

      // Extract long-term loan
      const longTermRow = loanTable.find('td:contains("Long-term loan")');
      if (longTermRow.length > 0) {
        const longTermValue = longTermRow.next('td').text().trim();
        longTermLoan = extractNumber(longTermValue);
      }
    }

    return {
      yearEnd: '31-Dec',
      loanStatus: {
        asOn: asOnDate,
        shortTermLoan: shortTermLoan * 1000000, // Convert mn to actual value
        longTermLoan: longTermLoan * 1000000 // Convert mn to actual value
      }
    };
  }

  extractShareholding($) {
    const extractNumber = (text) => {
      if (!text) return 0;
      const cleaned = text.replace(/[^\d.-]/g, '');
      return parseFloat(cleaned) || 0;
    };

    const shareholdingData = [];

    // Look for the "Other Information of the Company" section
    const otherInfoHeader = $('th:contains("Other Information of the Company")');
    
    if (otherInfoHeader.length > 0) {
      // Find the table containing shareholding information
      const shareholdingTable = otherInfoHeader.closest('table');
      
      // Look for rows containing "Share Holding Percentage"
      shareholdingTable.find('tr').each((i, row) => {
        const $row = $(row);
        const firstCell = $row.find('td').first().text().trim();
        
        // Check if this row contains shareholding percentage data
        if (firstCell.includes('Share Holding Percentage')) {
          const shareholdingEntry = {
            asOn: new Date(), // Default to current date
            sponsorDirector: 0,
            government: 0,
            institute: 0,
            foreign: 0,
            public: 0
          };

          // Extract the date/period information
          const dateMatch = firstCell.match(/(\w+\s+\d+,\s+\d+)/);
          if (dateMatch) {
            shareholdingEntry.asOn = new Date(dateMatch[1]);
          }

          // Get all cells in the current row
          const cells = $row.find('td');
          
          // Parse the shareholding data from the cells
          // Based on the image, the structure appears to be:
          // Cell 0: Period description
          // Cell 1: Sponsor/Director: XX.XX
          // Cell 2: Govt: XX.XX  
          // Cell 3: Institute: XX.XX
          // Cell 4: Foreign: XX.XX
          // Cell 5: Public: XX.XX
          
          cells.each((cellIndex, cell) => {
            const cellText = $(cell).text().trim();
            
            if (cellText.includes('Sponsor/Director:')) {
              const percentageText = cellText.replace('Sponsor/Director:', '').trim();
              shareholdingEntry.sponsorDirector = extractNumber(percentageText);
            } else if (cellText.includes('Govt:')) {
              const percentageText = cellText.replace('Govt:', '').trim();
              shareholdingEntry.government = extractNumber(percentageText);
            } else if (cellText.includes('Institute:')) {
              const percentageText = cellText.replace('Institute:', '').trim();
              shareholdingEntry.institute = extractNumber(percentageText);
            } else if (cellText.includes('Foreign:')) {
              const percentageText = cellText.replace('Foreign:', '').trim();
              shareholdingEntry.foreign = extractNumber(percentageText);
            } else if (cellText.includes('Public:')) {
              const percentageText = cellText.replace('Public:', '').trim();
              shareholdingEntry.public = extractNumber(percentageText);
            }
          });

          shareholdingData.push(shareholdingEntry);
        }
      });
    }

    // If no data found in the "Other Information" section, try alternative approach
    if (shareholdingData.length === 0) {
      // Look for shareholding data in any table that contains the specific pattern
      $('table').each((tableIndex, table) => {
        const $table = $(table);
        
        // Look for rows with shareholding percentage pattern
        $table.find('tr').each((rowIndex, row) => {
          const $row = $(row);
          const cells = $row.find('td');
          
          if (cells.length >= 5) {
            const firstCellText = $(cells[0]).text().trim();
            
            // Check if this looks like a shareholding row
            if (firstCellText.includes('Share Holding Percentage')) {
              
              const shareholdingEntry = {
                asOn: new Date(), // Default to current date
                sponsorDirector: 0,
                government: 0,
                institute: 0,
                foreign: 0,
                public: 0
              };

              // Try to extract date
              const dateMatch = firstCellText.match(/(\w+\s+\d+,\s+\d+)/);
              if (dateMatch) {
                shareholdingEntry.asOn = new Date(dateMatch[1]);
              }

              // Parse each cell for shareholding data
              cells.each((cellIndex, cell) => {
                const cellText = $(cell).text().trim();
                
                if (cellText.includes('Sponsor/Director:')) {
                  const percentageText = cellText.replace('Sponsor/Director:', '').trim();
                  shareholdingEntry.sponsorDirector = extractNumber(percentageText);
                } else if (cellText.includes('Govt:')) {
                  const percentageText = cellText.replace('Govt:', '').trim();
                  shareholdingEntry.government = extractNumber(percentageText);
                } else if (cellText.includes('Institute:')) {
                  const percentageText = cellText.replace('Institute:', '').trim();
                  shareholdingEntry.institute = extractNumber(percentageText);
                } else if (cellText.includes('Foreign:')) {
                  const percentageText = cellText.replace('Foreign:', '').trim();
                  shareholdingEntry.foreign = extractNumber(percentageText);
                } else if (cellText.includes('Public:')) {
                  const percentageText = cellText.replace('Public:', '').trim();
                  shareholdingEntry.public = extractNumber(percentageText);
                }
              });

              // Only add if we found some meaningful data
              if (shareholdingEntry.sponsorDirector > 0 || shareholdingEntry.government > 0 || 
                  shareholdingEntry.institute > 0 || shareholdingEntry.foreign > 0 || 
                  shareholdingEntry.public > 0) {
                shareholdingData.push(shareholdingEntry);
              }
            }
          }
        });
      });
    }

    return shareholdingData;
  }

  extractCorporateInformation($) {
    // Find the corporate information table by looking for the "Address of the Company" heading
    const corporateTable = $('h2:contains("Address of the Company")').next('.table-responsive').find('table');
    
    let address = 'N/A';
    let phone = ['N/A'];
    let email = 'N/A';
    let website = 'N/A';
    let companySecretary = {
      name: 'N/A',
      cell: 'N/A',
      telephone: 'N/A',
      email: 'N/A'
    };

    if (corporateTable.length > 0) {
      // Extract Head Office address
      const headOfficeRow = corporateTable.find('td:contains("Head Office")');
      if (headOfficeRow.length > 0) {
        address = headOfficeRow.next('td').text().trim() || 'N/A';
      }

      // Extract contact phone
      const contactPhoneRow = corporateTable.find('td:contains("Contact Phone")');
      if (contactPhoneRow.length > 0) {
        const phoneText = contactPhoneRow.parent().find('td').last().text().trim();
        phone = phoneText ? [phoneText] : ['N/A'];
      }

      // Extract email (first occurrence - company email)
      const emailRow = corporateTable.find('td:contains("E-mail")').first();
      if (emailRow.length > 0) {
        email = emailRow.parent().find('td').last().text().trim() || 'N/A';
      }

      // Extract website
      const websiteRow = corporateTable.find('td:contains("Web Address")');
      if (websiteRow.length > 0) {
        const websiteLink = websiteRow.parent().find('td').last().find('a');
        if (websiteLink.length > 0) {
          website = websiteLink.attr('href') || websiteLink.text().trim() || 'N/A';
        } else {
          website = websiteRow.parent().find('td').last().text().trim() || 'N/A';
        }
      }

      // Extract company secretary information
      const secretaryNameRow = corporateTable.find('td:contains("Company Secretary Name")');
      if (secretaryNameRow.length > 0) {
        companySecretary.name = secretaryNameRow.parent().find('td').last().text().trim() || 'N/A';
      }

      const secretaryCellRow = corporateTable.find('td:contains("Cell No.")');
      if (secretaryCellRow.length > 0) {
        companySecretary.cell = secretaryCellRow.parent().find('td').last().text().trim() || 'N/A';
      }

      const secretaryTelephoneRow = corporateTable.find('td:contains("Telephone No.")');
      if (secretaryTelephoneRow.length > 0) {
        companySecretary.telephone = secretaryTelephoneRow.parent().find('td').last().text().trim() || 'N/A';
      }

      // Extract company secretary email (second occurrence of E-mail)
      const emailRows = corporateTable.find('td:contains("E-mail")');
      if (emailRows.length > 1) {
        companySecretary.email = $(emailRows[1]).parent().find('td').last().text().trim() || 'N/A';
      }
    }

    return {
      address,
      phone,
      email,
      website,
      companySecretary
    };
  }

  extractLinks($, tradingCode) {
    // Find the links table by looking for "Details of Financial Statement" and "Price Sensitive Information"
    const linksTable = $('th:contains("Details of Financial Statement")').closest('table');
    
    let financialStatements = 'N/A';
    let priceSensitiveInformation = 'N/A';

    if (linksTable.length > 0) {
      // Extract financial statements link
      const financialStatementsRow = linksTable.find('th:contains("Details of Financial Statement")');
      if (financialStatementsRow.length > 0) {
        const linkElement = financialStatementsRow.next('td').find('a');
        if (linkElement.length > 0) {
          // Get the full URL from href attribute or text content
          financialStatements = linkElement.attr('href') || linkElement.text().trim();
        } else {
          // If no anchor tag, get the text content directly
          financialStatements = financialStatementsRow.next('td').text().trim();
        }
      }

      // Extract price sensitive information link
      const psiRow = linksTable.find('th:contains("Price Sensitive Information")');
      if (psiRow.length > 0) {
        const linkElement = psiRow.next('td').find('a');
        if (linkElement.length > 0) {
          // Get the full URL from href attribute or text content
          priceSensitiveInformation = linkElement.attr('href') || linkElement.text().trim();
        } else {
          // If no anchor tag, get the text content directly
          priceSensitiveInformation = psiRow.next('td').text().trim();
        }
      }
    }
    
    return {
      financialStatements,
      priceSensitiveInformation
    };
  }

  // Helper method to parse ranges like "4.40 - 4.40"
  parseRange(rangeText) {
    if (!rangeText || typeof rangeText !== 'string') {
      return { low: 0, high: 0 };
    }
    // Normalize various separators (hyphen, en dash, em dash, 'to')
    const parts = rangeText
      .split(/\s*(?:-|–|—|to)\s*/i)
      .map((part) => {
        const cleaned = part.replace(/[^0-9.-]/g, ''); // remove thousands separators and non-numerics
        const num = parseFloat(cleaned);
        return isNaN(num) ? null : num;
      })
      .filter((n) => n !== null);

    const low = parts[0] ?? 0;
    const high = parts[1] ?? parts[0] ?? 0;

    return { low, high };
  }
}

module.exports = new StockScraper();