const request = require("request-promise");
const cheerio = require("cheerio");
const Nightmare= require("nightmare");
const nightmare = Nightmare({show: false});


const createCsvWriter = require('csv-writer').createObjectCsvWriter;



async function scrapeInfo(date){
        const result = await request.get(
           `https://www.imdb.com/search/title/?title_type=feature&year=${date}-01-01,${date}-12-31&sort=num_votes,desc`
        );

        const $ = await cheerio.load(result);

        const movies =$("div.lister-item").map((i, element)=>{
            const year = date;
            const title = $(element).find("h3>a").text().trim();
            const director =$(element).find("div.lister-item-content > p:not(.text-muted) > a ").first().text();
            const description = $(element).find("div.lister-item-content > p.text-muted").last().text().trim();
            const descriptionUrl = "https://www.imdb.com" + $(element).find("div.lister-item-image > a").attr('href')
            
            const rating = $(element).find("div.inline-block.ratings-imdb-rating > strong").text().trim();
            const genre = $(element).find("span.genre").text().trim();
            const certificate = $(element).find("span.certificate").text().trim();
            const runtime = $(element).find("span.runtime").text().trim();
            const gross= $(element).find("p.sort-num_votes-visible > span[name='nv']").last().attr('data-value')
            
            return { rank: i + 1 , year, title, description, director, descriptionUrl, rating, genre, certificate, runtime, gross }
        }).get();
        return movies;
}


async function scrapePosterImageUrl(movies){
    
    for(var i = 0 ; i < movies.length; i++){
    try{

            const posterUrl = await nightmare.goto(movies[i].posterUrl).evaluate(()=> 
            $("#photo-container > div > div:nth-child(3) > div > div.pswp__scroll-wrap > div.pswp__container > div:nth-child(2) > div > img:nth-child(2)").attr("src")
            );
            
           movies[i].posterUrl = posterUrl;
    }catch(err){
        console.log(err)
    }
}
    return movies;
    
    
} 


async function scrapePosterUrl(movies){
    const moviesWithPosterUrls = await Promise.all(movies.map(async movie=> {
        try{
            const html = await request.get(movie.descriptionUrl);
            const $ = await cheerio.load(html);
            movie.posterUrl = "https://www.imdb.com" + $("div.poster > a").attr("href");
            return movie;
        }catch(err){
            console.log(err);
        }
    })
    );
    return moviesWithPosterUrls;
}


async function main(date){

    let movies = await scrapeInfo(date);
    movies = await scrapePosterUrl(movies);
    movies = await scrapePosterImageUrl(movies)
    createJson(movies)
    console.log(movies)
}

 function createJson(data){
   
    const csvWriter = createCsvWriter({
        append: true,
        path: 'out.csv',
        header: [
         {id: 'rank', tittle: 'Rank'},
          {id: 'year', title: 'Year'},
          {id: 'title', title: 'Title'},
          {id: 'description', title: 'Surname'},
          {id: 'director', title: 'Director'},
          {id: 'descriptionUrl', title: 'DescriptionUrl'},
          {id: 'posterUrl', title: 'PosterUrl'},
          {id: 'rating', title: 'Rating'},
          {id: 'genre', title: 'Genre'},
          {id: 'certificate', title: 'Certificate'},
          {id: 'runtime', title: 'Runtime'},
          {id: 'gross', tittle:'Gross'}

        ]
      });


     csvWriter.writeRecords(data).then(()=>
        console.log('The csv file was wirtten successfully'));
}



async function start(data){
    
    if(data < 2020){
    await main(data)
    await  start(data+1)
   
    }
    console.log('STOP');
}

start(2003)
   




