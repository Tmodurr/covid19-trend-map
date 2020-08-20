import axios from 'axios';

import {
    Covid19CasesByTimeFeature
} from 'covid19-trend-map';

type FetchCovid19DataOptions = {
    countyFIPS?: string;
    stateName?: string;
}

const USCountiesCovid19CasesByTimeFeatureServiceURL = 'https://services9.arcgis.com/6Hv9AANartyT7fJW/ArcGIS/rest/services/USCounties_cases_V1/FeatureServer/1';

const cachedQueryResults: {
    [key:string]: Covid19CasesByTimeFeature[]
} = {};

export const fetchCovid19Data = async({
    countyFIPS,
    stateName
}:FetchCovid19DataOptions):Promise<Covid19CasesByTimeFeature[]>=>{

    const key4CachedResults = countyFIPS || stateName;

    if(cachedQueryResults[key4CachedResults]){
        return cachedQueryResults[key4CachedResults];
    }

    const requestUrl = `${USCountiesCovid19CasesByTimeFeatureServiceURL}/query`;

    const params = countyFIPS
        ? {
            f: 'json',
            where: `FIPS='${countyFIPS}'`,
            outFields: 'dt,Confirmed,Deaths,NewCases,Population',
            orderByFields: 'dt'
        }
        : {
            f: 'json',
            where: `ST_Name='${stateName}'`,
            outFields: '*',
            orderByFields: 'dt',
            groupByFieldsForStatistics: 'ST_Name,dt',
            outStatistics: JSON.stringify([
                {
                    "statisticType": "sum",
                    "onStatisticField": "Confirmed", 
                    "outStatisticFieldName": "Confirmed"
                },
                {
                    "statisticType": "sum",
                    "onStatisticField": "Deaths", 
                    "outStatisticFieldName": "Deaths"
                },
                {
                    "statisticType": "sum",
                    "onStatisticField": "NewCases",
                    "outStatisticFieldName": "NewCases"
                },
                {
                    "statisticType": "sum",
                    "onStatisticField": "Population",
                    "outStatisticFieldName": "Population"
                }  
            ])
        };

    try {
        const { data } = await axios.get(requestUrl, { 
            params: new URLSearchParams(params)
        });

        if(data && data.features){
            // console.log(data.features)

            const features:Covid19CasesByTimeFeature[] = data.features.map((feature:Covid19CasesByTimeFeature, index:number)=>{
        
                const previousFeature = index > 0 
                    ? data.features[index - 1] 
                    : undefined;
        
                const newDeaths = previousFeature 
                    ? feature.attributes.Deaths - previousFeature.attributes.Deaths 
                    : 0;
        
                feature.attributes.NewDeaths = newDeaths;

                return feature
            });

            // console.log(features)

            cachedQueryResults[key4CachedResults] = features;

            return features;
        }

    } catch(err){
        console.error(err);
    }

    return null;
};