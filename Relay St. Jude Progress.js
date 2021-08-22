// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: yellow; icon-glyph: heart;
// config
const width = 320;
const primaryTextColor = new Color("#efefef");

const widget = new ListWidget();
widget.setPadding(8, 15, 8, 10);

// widget background
const gradient = new LinearGradient();
gradient.colors = [    
    new Color(`#dcb748`),
    new Color(`#d6aa29`)
];
gradient.locations = [0.0, 1];
widget.backgroundGradient = gradient;

widget.url = "https://stjude.org/relay";

// api request
const req = new Request('https://api.tiltify.com');
req.headers = {    
  'Content-Type': 'application/json'
};
req.method = "POST";
req.body = JSON.stringify({
	"operationName": "get_campaign_by_vanity_and_slug",
	"variables": {"vanity": "@relay-fm", "slug": "relay-st-jude-21"},
	"query": `query get_campaign_by_vanity_and_slug($vanity: String, $slug: String) {
  campaign(vanity: $vanity, slug: $slug) {
    id
    name
    slug
    status
    originalGoal {
      value
      currency
    }
    team {
      name
    }
    description
    totalAmountRaised {
      currency
      value
    }
    goal {
      currency
      value
    }
    avatar {
      alt
      height
      width
      src
    }
    milestones {
      id
      name
      amount {
        value
        currency
      }
    }
  }
}`
});
let body = await req.loadJSON();

// the important numbers (converting to float so we can run toLocaleString on them)
const soFar = parseFloat(body.data.campaign.totalAmountRaised.value);
const total = parseFloat(body.data.campaign.goal.value);

// build widget
// heading
const titleText = widget.addText(body.data.campaign.name);
titleText.textColor = primaryTextColor;
titleText.font = Font.boldSystemFont(24);

widget.addSpacer(8);

// soFar / total in text
const amountText = widget.addText(`${soFar.toLocaleString('en-US', {style: 'currency', currency: 'USD'})} / ${total.toLocaleString('en-US', {style: 'currency', currency: 'USD'})}`);
amountText.textColor = primaryTextColor;
amountText.font = Font.heavyRoundedSystemFont(20);

widget.addSpacer(6);

// progress bar & percentage
const progressBar = widget.addImage(createProgressBar(total, soFar, 20, true));
progressBar.imageSize = new Size(width, 20);

widget.addSpacer(4);

// only show as many milestones as the user requests
// (1 looks good on a medium widget, 3 or 4 on a large)
let maxMilestones = args.widgetParameter;
let milestonesDisplayed = 0;

// Ensure milestones are in order from lowest to highest total
const sortedMilestones = body.data.campaign.milestones.sort((a, b) => {
    const aVal = parseFloat(a.amount.value);
    const bVal = parseFloat(b.amount.value);
    
    return aVal - bVal;
});

console.log(sortedMilestones);

// progress bars for milestones
for (let milestone of sortedMilestones) {
    if (maxMilestones != undefined && milestonesDisplayed >= maxMilestones) {
        break;
    }
    
    // calculate milestone percentage
    const milestoneTotal = parseFloat(milestone.amount.value);
    const percentage = (soFar / milestoneTotal) * 100;
    
    // if the milestone is long past, no need to show it
    if (percentage < 110) {    
        widget.addSpacer(6);
        
        // a stack will let us put the name and percentage side by side
        const stack = widget.addStack();
        stack.spacing = 4;
    
        // milestone name
        const milestoneNameText = stack.addText(milestone.name);
        milestoneNameText.textColor = primaryTextColor;
        milestoneNameText.font = Font.boldSystemFont(16);
        milestoneNameText.lineLimit = 2;
        
        // milestone percentage
        const percentageFixed = percentage.toFixed(2);
        const percentageText = stack.addText(`${percentageFixed}%`);
        percentageText.textColor = primaryTextColor;
        percentageText.font = Font.regularRoundedSystemFont(16);
        
        widget.addSpacer(6);
    
        // milestone progress bar
        const milestoneProgressBar = widget.addImage(createProgressBar(milestoneTotal, soFar, 10, false));    
        milestoneProgressBar.imageSize = new Size(width, 10);
        
        milestonesDisplayed += 1;
    }
}


Script.setWidget(widget);
Script.complete();
widget.presentLarge();

function createProgressBar(total, soFar, height, showPercentage = false) {
    const context = new DrawContext();
    context.size = new Size(width, height);
    context.opaque = false;
    context.respectScreenScale = true;
    
    // bar background
    context.setFillColor(new Color("#48484b"));
    const bgPath = new Path();
    bgPath.addRoundedRect(new Rect(0, 0, width, height), height / 2, (height / 2) - 1);
    context.addPath(bgPath);
    context.fillPath();
    
    // bar foreground
    context.setFillColor(new Color("#00b100"));
    const fgPath = new Path();
    fgPath.addRoundedRect(new Rect(0, 0, (width * soFar)/total, height), height / 2, (height / 2) - 1);
    context.addPath(fgPath);
    context.fillPath();
    
    // percentage text
    if (showPercentage) {
        const percentage = ((soFar / total) * 100).toFixed(2);
        let xPos = (width * soFar)/total + 5;
        // if over 70%, show in foreground area
        // to ensure that it doesnt overflow the display
        if (percentage > 70) {
            xPos = (width * soFar)/total - 55;
        }
        context.setFont(Font.semiboldRoundedSystemFont(14));
        context.setTextColor(primaryTextColor);
        context.drawText(`${percentage}%`, new Point(xPos, (height / 14)));
    }

    return context.getImage();
}

