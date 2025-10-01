const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: true
  },
  tradingCode: {
    type: String,
    required: true,
    unique: true
  },
  scripCode: {
    type: String,
    required: true
  },
  sector: {
    type: String,
    required: true
  },
  marketInformation: {
    asOfDate: {
      type: Date,
      required: true
    },
    lastTradingPrice: {
      type: Number,
      required: true
    },
    closingPrice: {
      type: Number,
      required: true
    },
    change: {
      type: Number,
      required: true
    },
    changePercentage: {
      type: Number,
      required: true
    },
    openingPrice: {
      type: Number,
      required: true
    },
    adjustedOpeningPrice: {
      type: Number,
      required: true
    },
    yesterdaysClosingPrice: {
      type: Number,
      required: true
    },
    daysRange: {
      low: {
        type: Number,
        required: true
      },
      high: {
        type: Number,
        required: true
      }
    },
    fiftyTwoWeeksMovingRange: {
      low: {
        type: Number,
        required: true
      },
      high: {
        type: Number,
        required: true
      }
    },
    daysValue: {
      type: Number,
      required: true
    },
    daysVolume: {
      type: Number,
      required: true
    },
    daysTradeCount: {
      type: Number,
      required: true
    },
    marketCapitalization: {
      type: Number,
      required: true
    }
  },
  basicInformation: {
    authorizedCapital: {
      type: Number,
      required: true
    },
    paidUpCapital: {
      type: Number,
      required: true
    },
    faceValue: {
      type: Number,
      required: true
    },
    totalOutstandingSecurities: {
      type: Number,
      required: true
    },
    typeOfInstrument: {
      type: String,
      required: true
    },
    marketLot: {
      type: Number,
      required: true
    },
    listingYear: {
      type: Number,
      required: true
    },
    marketCategory: {
      type: String,
      required: true
    },
    isElectronicShare: {
      type: Boolean,
      required: true
    }
  },
  financialPerformance: {
    interimEPS: [{
      year: {
        type: Number,
        required: true
      },
      period: {
        type: String,
        required: true
      },
      endingOn: {
        type: Date,
        required: true
      },
      basic: {
        type: Number,
        required: true
      },
      diluted: {
        type: Number,
        default: null
      }
    }],
    periodEndMarketPrice: [{
      period: {
        type: String,
        required: true
      },
      price: {
        type: Number,
        required: true
      }
    }]
  },
  corporateActions: {
    lastAGMDate: {
      type: Date,
      required: true
    },
    forYearEnded: {
      type: Date,
      required: true
    },
    cashDividends: [{
      year: {
        type: Number,
        required: true
      },
      percentage: {
        type: Number,
        required: true
      }
    }],
    bonusIssues: [{
      year: {
        type: Number,
        required: true
      },
      percentage: {
        type: Number,
        required: true
      }
    }],
    rightIssues: [{
      year: {
        type: Number,
        required: true
      },
      ratio: {
        type: String,
        required: true
      }
    }]
  },
  financialHighlights: {
    yearEnd: {
      type: String,
      required: true
    },
    loanStatus: {
      asOn: {
        type: Date,
        required: true
      },
      shortTermLoan: {
        type: Number,
        required: true
      },
      longTermLoan: {
        type: Number,
        required: true
      }
    }
  },
  shareholding: [{
    asOn: {
      type: Date,
      required: true
    },
    sponsorDirector: {
      type: Number,
      required: true
    },
    government: {
      type: Number,
      required: true
    },
    institute: {
      type: Number,
      required: true
    },
    foreign: {
      type: Number,
      required: true
    },
    public: {
      type: Number,
      required: true
    }
  }],
  corporateInformation: {
    address: {
      type: String,
      required: true
    },
    phone: [{
      type: String,
      required: true
    }],
    email: {
      type: String,
      required: true
    },
    website: {
      type: String,
      required: true
    },
    companySecretary: {
      name: {
        type: String,
        required: true
      },
      cell: {
        type: String,
        required: true
      },
      telephone: {
        type: String,
        required: true
      },
      email: {
        type: String,
        required: true
      }
    }
  },
  links: {
    financialStatements: {
      type: String,
      required: false
    },
    priceSensitiveInformation: {
      type: String,
      required: false
    }
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Stock', stockSchema);