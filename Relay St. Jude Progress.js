// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: yellow; icon-glyph: heart;
// config
const width = 320;
const height = 20;
const primaryTextColor = new Color("#efefef");

const widget = new ListWidget();
widget.backgroundColor = new Color("#dcb748");
widget.url = "https://stjude.org/relay";

console.log(Device.locale());
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
const amountText = widget.addText(`$${soFar.toLocaleString()} / $${total.toLocaleString()}`);
amountText.textColor = primaryTextColor;
amountText.font = Font.heavyRoundedSystemFont(20);

widget.addSpacer(6);

// progress bar & percentage
const progressBar = widget.addImage(createProgressBar(total, soFar));
progressBar.imageSize=new Size(width, height);

Script.setWidget(widget);
Script.complete();
widget.presentMedium();

function createProgressBar(total, soFar){
    const context = new DrawContext();
    context.size = new Size(width, height);
    context.opaque = false;
    context.respectScreenScale = true;
    
    // bar background
    context.setFillColor(new Color("#48484b"));
    const bgPath = new Path();
    bgPath.addRoundedRect(new Rect(0, 0, width, height), 10, 9);
    context.addPath(bgPath);
    context.fillPath();
    
    // bar foreground
    context.setFillColor(new Color("#00b100"));
    const fgPath = new Path();
    fgPath.addRoundedRect(new Rect(0, 0, (width * soFar)/total, height), 10, 9);
    context.addPath(fgPath);
    context.fillPath();
    
    // percentage text
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

    return context.getImage();
}

