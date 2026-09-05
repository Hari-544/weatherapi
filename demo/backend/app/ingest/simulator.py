import random
from datetime import datetime, timedelta

from app.models.weather_event import EventSource
from app.services.geolocation import get_city_coordinates, get_city_state

HASHTAGS = ["#IMD", "#Weather", "#IndiaWeather", "#Monsoon", "#HeavyRain",
            "#Flood", "#Cyclone", "#Heatwave", "#Thunderstorm", "#FogAlert",
            "#DustStorm", "#IndiaWeatherAlert"]

HANDLES = ["@IMDweather", "@rdx_weather", "@skyalert_in", "@weatherindia_x",
           "@citizen_reporter", "@monsoonwatch", "@cyclonetrack", "@delhimonsoon"]

SCENARIOS = [
    ("rainfall", [
        "Heavy rainfall lashed {city}, waterlogging reported in several areas. #IMD #Monsoon",
        "IMD predicts intense rainfall over {city} for next 48 hours. #Weather #HeavyRain",
        "Record {amount}mm rainfall recorded in {city} in 24 hours. #IMD #IndiaWeather",
    ]),
    ("thunderstorm", [
        "Severe thunderstorm with gusty winds hits {city}. Trees uprooted. #Thunderstorm #IMD",
        "Lightning strikes damage property in {city}. #Weather #IndiaWeatherAlert",
    ]),
    ("flooding", [
        "Flash floods in {city}, rescue operations underway. #Flood #IMD",
        "River water level crosses danger mark near {city}. {affected} evacuated. #Flood #IndiaWeather",
    ]),
    ("heatwave", [
        "Heatwave grips {city}, temperature crosses {temp}°C. #Heatwave #Weather",
        "Heatstroke cases reported in {city} as temperatures soar. #IMD #IndiaWeather",
    ]),
    ("fog", [
        "Dense fog disrupts transportation in {city}. Visibility below 50m. #FogAlert #Weather",
        "Flight operations hit by dense fog at {city}. #IMD #IndiaWeather",
    ]),
    ("dust_storm", [
        "Dust storm sweeps through {city}, reducing visibility. #DustStorm #Weather",
        "Massive dust storm damages property in {city}. #IMD #IndiaWeatherAlert",
    ]),
    ("strong_winds", [
        "Strong winds of {wind}m/s batter {city}. Damage reported. #Weather #IndiaWeather",
        "Gusty winds disrupt outdoor events in {city}. #IMD",
    ]),
    ("cyclone", [
        "Cyclone approaching {city} coast, evacuations ordered. #Cyclone #IMD",
        "Severe cyclonic storm likely to make landfall near {city}. #Cyclone #IndiaWeatherAlert",
    ]),
]

FAKE_SCENARIOS = [
    ("Share before they delete this! Government hiding real flood numbers in {city}. Forward to everyone you know. 100% true! #IMD"),
    ("URGENT: Send money to help {city} flood victims NOW. Forward to 10 people or bad luck. Click this link. #Flood"),
    ("Miracle cure for heatwave in {city} exposed! Doctors don't want you to know. Act now. #Heatwave"),
    ("Conspiracy: IMD covering up massive cyclone heading to {city}. Exposed!! Click here for truth. #Cyclone"),
]

CITIES = ["Mumbai", "Delhi", "Bengaluru", "Chennai", "Kolkata", "Hyderabad", "Pune",
          "Ahmedabad", "Jaipur", "Lucknow", "Bhopal", "Patna", "Guwahati", "Kochi",
          "Indore", "Nagpur", "Thiruvananthapuram", "Visakhapatnam", "Varanasi",
          "Amritsar", "Bhubaneswar", "Chandigarh", "Shimla", "Dehradun", "Raipur"]


class SocialStreamSimulator:
    def generate_posts(self, n: int = 20) -> list:
        posts = []
        now = datetime.utcnow()
        for i in range(n):
            city = random.choice(CITIES)
            coords = get_city_coordinates(city)
            state = get_city_state(city)

            if random.random() < 0.12:
                text = random.choice(FAKE_SCENARIOS).format(city=city)
            else:
                # SCENARIOS is a list of (event_type, [templates])
                scenarios = list(SCENARIOS)
                _, templates = random.choice(scenarios)
                template = random.choice(templates)
                amount = random.randint(60, 320)
                temp = random.randint(41, 49)
                wind = random.randint(15, 35)
                affected = random.randint(500, 50000)
                text = template.format(city=city, amount=amount, temp=temp, wind=wind, affected=affected)

            post_id = str(10**15 + random.randint(0, 10**14))
            posts.append({
                "title": text[:200],
                "description": text,
                "source": EventSource.SOCIAL,
                "source_handle": random.choice(HANDLES),
                "source_url": f"https://x.com/status/{post_id}",
                "hashtags": [h for h in HASHTAGS if h in text],
                "city": city,
                "state": state,
                "latitude": coords["latitude"] + random.uniform(-0.08, 0.08),
                "longitude": coords["longitude"] + random.uniform(-0.08, 0.08),
                "metadata": {"likes": random.randint(5, 2000), "retweets": random.randint(1, 500),
                             "simulated": True},
                "reported_at": now - timedelta(days=random.randint(0, 14),
                                               hours=random.randint(0, 23),
                                               minutes=random.randint(0, 59)),
            })
        return posts


simulator = SocialStreamSimulator()
