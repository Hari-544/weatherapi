import math

INDIAN_CITY_COORDINATES = {
    "Mumbai": (19.0760, 72.8777), "Pune": (18.5204, 73.8567), "Nagpur": (21.1458, 79.0882),
    "Nashik": (19.9975, 73.7898), "Delhi": (28.6139, 77.2090), "New Delhi": (28.6139, 77.2090),
    "Bengaluru": (12.9716, 77.5946), "Mysuru": (12.2958, 76.6394), "Hubli": (15.3647, 75.1240),
    "Chennai": (13.0827, 80.2707), "Coimbatore": (11.0168, 76.9558), "Madurai": (9.9252, 78.1198),
    "Salem": (11.6643, 78.1460), "Tiruchirappalli": (10.7905, 78.7047), "Kolkata": (22.5726, 88.3639),
    "Siliguri": (26.7271, 88.3953), "Hyderabad": (17.3850, 78.4867), "Warangal": (17.9784, 79.5941),
    "Ahmedabad": (23.0225, 72.5714), "Surat": (21.1702, 72.8311), "Rajkot": (22.3039, 70.8022),
    "Vadodara": (22.3072, 73.1812), "Jaipur": (26.9124, 75.7873), "Jodhpur": (26.2389, 73.0243),
    "Udaipur": (24.5854, 73.7125), "Lucknow": (26.8467, 80.9462), "Varanasi": (25.3176, 82.9739),
    "Kanpur": (26.4499, 80.3319), "Agra": (27.1767, 78.0081), "Meerut": (28.9845, 77.7064),
    "Prayagraj": (25.4358, 81.8463), "Bhopal": (23.2599, 77.4126), "Indore": (22.7196, 75.8577),
    "Gwalior": (26.2183, 78.1828), "Patna": (25.6093, 85.1376), "Ranchi": (23.3441, 85.3096),
    "Dhanbad": (23.7957, 86.4304), "Bhubaneswar": (20.2961, 85.8245), "Cuttack": (20.4625, 85.8830),
    "Kochi": (9.9312, 76.2673), "Thiruvananthapuram": (8.5241, 76.9366), "Chandigarh": (30.7333, 76.7794),
    "Guwahati": (26.1445, 91.7362), "Shimla": (31.1048, 77.1734), "Dehradun": (30.3165, 78.0322),
    "Srinagar": (34.0837, 74.7973), "Amritsar": (31.6340, 74.8723), "Ludhiana": (30.9010, 75.8573),
    "Imphal": (24.8170, 93.9368), "Shillong": (25.5788, 91.8933), "Agartala": (23.8315, 91.2868),
    "Aizawl": (23.7271, 92.7176), "Kohima": (25.6586, 94.1086), "Gangtok": (27.3389, 88.6065),
    "Panaji": (15.4909, 73.8278), "Raipur": (21.2514, 81.6296), "Visakhapatnam": (17.6868, 83.2185),
    "Tirupati": (13.6288, 79.4192), "Vijayawada": (16.5062, 80.6480),
}

CITY_STATE = {
    "Mumbai": "Maharashtra", "Pune": "Maharashtra", "Nagpur": "Maharashtra", "Nashik": "Maharashtra",
    "Delhi": "Delhi", "New Delhi": "Delhi", "Bengaluru": "Karnataka", "Mysuru": "Karnataka",
    "Hubli": "Karnataka", "Chennai": "Tamil Nadu", "Coimbatore": "Tamil Nadu", "Madurai": "Tamil Nadu",
    "Salem": "Tamil Nadu", "Tiruchirappalli": "Tamil Nadu", "Kolkata": "West Bengal", "Siliguri": "West Bengal",
    "Hyderabad": "Telangana", "Warangal": "Telangana", "Ahmedabad": "Gujarat", "Surat": "Gujarat",
    "Rajkot": "Gujarat", "Vadodara": "Gujarat", "Jaipur": "Rajasthan", "Jodhpur": "Rajasthan",
    "Udaipur": "Rajasthan", "Lucknow": "Uttar Pradesh", "Varanasi": "Uttar Pradesh", "Kanpur": "Uttar Pradesh",
    "Agra": "Uttar Pradesh", "Meerut": "Uttar Pradesh", "Prayagraj": "Uttar Pradesh", "Bhopal": "Madhya Pradesh",
    "Indore": "Madhya Pradesh", "Gwalior": "Madhya Pradesh", "Patna": "Bihar", "Ranchi": "Jharkhand",
    "Dhanbad": "Jharkhand", "Bhubaneswar": "Odisha", "Cuttack": "Odisha", "Kochi": "Kerala",
    "Thiruvananthapuram": "Kerala", "Chandigarh": "Chandigarh", "Guwahati": "Assam", "Shimla": "Himachal Pradesh",
    "Dehradun": "Uttarakhand", "Srinagar": "Jammu and Kashmir", "Amritsar": "Punjab", "Ludhiana": "Punjab",
    "Imphal": "Manipur", "Shillong": "Meghalaya", "Agartala": "Tripura", "Aizawl": "Mizoram",
    "Kohima": "Nagaland", "Gangtok": "Sikkim", "Panaji": "Goa", "Raipur": "Chhattisgarh",
    "Visakhapatnam": "Andhra Pradesh", "Tirupati": "Andhra Pradesh", "Vijayawada": "Andhra Pradesh",
}


def get_city_coordinates(city: str):
    coords = INDIAN_CITY_COORDINATES.get(city)
    if coords:
        return {"latitude": coords[0], "longitude": coords[1]}
    for key, value in INDIAN_CITY_COORDINATES.items():
        if key.lower() == city.lower():
            return {"latitude": value[0], "longitude": value[1]}
    return {"latitude": None, "longitude": None}


def get_city_state(city: str):
    for key, state in CITY_STATE.items():
        if key.lower() == city.lower():
            return state
    return None


def haversine_distance(lat1, lon1, lat2, lon2):
    R = 6371.0
    lat1r, lat2r = math.radians(lat1), math.radians(lat2)
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2) ** 2 + math.cos(lat1r) * math.cos(lat2r) * math.sin(dlon / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


ALL_STATES = sorted({v for v in CITY_STATE.values()})
