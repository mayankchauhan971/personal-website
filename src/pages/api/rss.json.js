
const RSS_CONFIG = {
  tech: {
    url: 'https://firstprinciplesdesign.substack.com/feed',
    category: 'tech'
  },
  product: {
    url: 'https://whythatworked.substack.com/feed',
    category: 'product'
  }
};

// Parse XML and extract article data
function parseRSSFeed(xmlText, category) {
  try {
    // Simple XML parsing
    const items = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    
    while ((match = itemRegex.exec(xmlText)) !== null) {
      const itemContent = match[1];
      
      // Extract basic fields
      const titleMatch = itemContent.match(/<title>([\s\S]*?)<\/title>/);
      const descriptionMatch = itemContent.match(/<description>([\s\S]*?)<\/description>/);
      const linkMatch = itemContent.match(/<link>([\s\S]*?)<\/link>/);
      const pubDateMatch = itemContent.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
      
      if (titleMatch && linkMatch) {
        const title = titleMatch[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim();
        const description = descriptionMatch ? descriptionMatch[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim() : '';
        const link = linkMatch[1].trim();
        const pubDate = pubDateMatch ? pubDateMatch[1].trim() : new Date().toISOString();
        
        // Clean description and create summary
        let cleanDescription = description;
        if (description.includes('<![CDATA[') && description.includes(']]>')) {
          cleanDescription = description.replace(/<!\[CDATA\[|\]\]>/g, '');
        }
        
        // Strip HTML tags for summary
        const textContent = cleanDescription.replace(/<[^>]*>/g, '');
        const summary = textContent.length > 200 
          ? textContent.substring(0, 200).trim() + '...'
          : textContent.trim();
        
        items.push({
          title: title,
          summary: summary,
          url: link,
          date: new Date(pubDate).toISOString().split('T')[0],
          category: category,
          source: 'substack',
          external: true,
          tags: ['substack', category]
        });
      }
    }
    
    return items.slice(0, 10); // Limit to 10 most recent
  } catch (error) {
    console.error(`Error parsing ${category} RSS feed:`, error);
    return [];
  }
}

// Fetch RSS feed with error handling
async function fetchRSSFeed(feedUrl, category) {
  try {
    const response = await fetch(feedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RSSBot/1.0)'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const xmlText = await response.text();
    return parseRSSFeed(xmlText, category);
  } catch (error) {
    console.error(`Error fetching ${category} RSS feed:`, error);
    return [];
  }
}

export async function GET() {
  try {
    // Fetch all RSS feeds in parallel
    const feedPromises = Object.entries(RSS_CONFIG).map(([key, config]) =>
      fetchRSSFeed(config.url, config.category)
    );
    
    const results = await Promise.all(feedPromises);
    
    // Combine all articles
    const allArticles = results.flat();
    
    // Sort by date (newest first), articles without dates go to the bottom
    allArticles.sort((a, b) => {
      if (!a.date && !b.date) return 0;
      if (!a.date) return 1; // a goes to bottom
      if (!b.date) return -1; // b goes to bottom
      return new Date(b.date) - new Date(a.date);
    });
    
    // Return the articles as JSON
    return new Response(JSON.stringify({
      success: true,
      articles: allArticles,
      count: allArticles.length,
      lastUpdated: new Date().toISOString()
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=86400, s-maxage=86400' // Cache for 24 hours
      }
    });
    
  } catch (error) {
    console.error('Error in RSS handler:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch RSS feeds',
      articles: []
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}
