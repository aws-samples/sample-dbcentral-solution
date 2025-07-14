
export const configuration = 
{
    "apps-settings": {
        "refresh-interval": 10*1000,        
        "refresh-interval-dsql-dashboard": 20*1000,
        "api_url": "",
        "release" : "0.1.2.0.1",
        "release-enforcement" : false,
        "application-title": "DBCentral Monitoring",
        "version-code-url" : "https://version.code.ds.wwcs.aws.dev/",
        "items-per-page": 10
    },
    "colors": {
        "fonts" : {
            "metric102" : "#4595dd",
            "metric101" : "#e59400",
            "metric100" : "",
        },
        "lines" : {
            "separator100" : "#737c85",
            "separator101" : "#9e9b9a",
            "separator102" : "#e6e6e6"
        }
    }
};

export const SideMainLayoutHeader = { text: 'Database Services', href: '#/' };

export const SideMainLayoutMenu = [
    { type: "link", text: "Home", href: "/" },
    {
      text: 'Relational Engines',
      type: 'section',
      defaultExpanded: true,
      items: [
        { type: 'link', text: 'DSQL Clusters', href: '/clusters/dsql/' },        
      ],
    },
    { type: "divider" },
    {
          type: "link",
          text: "Documentation",
          href: "https://github.com/aws-samples/db-central-monitoring",
          external: true,
          externalIconAriaLabel: "Opens in a new tab"
    }
  ];


export const breadCrumbs = [{text: 'Service',href: '#',},{text: 'Resource search',href: '#',},];



  