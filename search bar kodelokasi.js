let locations = [];
        let districts = [];
        let subdistricts = [];
        let provinces = [];

        async function fetchData() {
            const response = await fetch('https://raw.githubusercontent.com/kodewilayah/permendagri-72-2019/refs/heads/main/dist/base.csv');
            const data = await response.text();
            parseCSV(data);
        }

        function parseCSV(data) {
            const rows = data.trim().split('\n').map(line => line.split(','));

            rows.forEach(row => {
                const code = row[0];
                const name = row[1];

                if (code.length === 2) {
                    provinces.push({ code, name });
                } else if (code.length === 5) {
                    districts.push({ code, name });
                } else if (code.length === 8) {
                    const districtCode = code.slice(0, 5);
                    const district = districts.find(d => d.code === districtCode);
                    subdistricts.push({ code, name, district: district ? district.name : 'Unknown' });
                } else if (code.length > 8) {
                    const subdistrictCode = code.slice(0, 8);
                    const subdistrict = subdistricts.find(s => s.code === subdistrictCode);
                    const districtCode = subdistrictCode.slice(0, 5);
                    const district = districts.find(d => d.code === districtCode);
                    const provinceCode = districtCode.slice(0, 2);
                    const province = provinces.find(p => p.code === provinceCode);

                    locations.push({
                        code,
                        name,
                        subdistrict: subdistrict ? subdistrict.name : 'Unknown',
                        district: district ? district.name : 'Unknown',
                        province: province ? province.name : 'Unknown',
                    });
                }
            });
        }

        function showSuggestions() {
            const input = document.getElementById('searchInput').value.toLowerCase();
            const suggestionsDiv = document.getElementById('suggestions');
            const resultDiv = document.getElementById('result');
            const hasilAnchor = document.getElementById('hasil');

            suggestionsDiv.innerHTML = ''; 
            resultDiv.style.display = 'none'; 
            hasilAnchor.textContent = ''; 

            if (input) {
                suggestionsDiv.style.display = 'block'; 

                const filteredSuggestions = [];

                provinces.forEach(province => {
                    if (province.name.toLowerCase().includes(input)) {
                        filteredSuggestions.push({
                            code: province.code,
                            name: province.name,
                            category: 'Provinsi',
                            details: ''
                        });
                    }
                });

                districts.forEach(district => {
                    if (district.name.toLowerCase().includes(input)) {
                        const province = provinces.find(p => p.code === district.code.slice(0, 2));
                        filteredSuggestions.push({
                            code: district.code,
                            name: district.name,
                            category: 'Kabupaten/Kota',
                            details: `Provinsi: ${province ? province.name : 'Unknown'}`
                        });
                    }
                });

                subdistricts.forEach(subdistrict => {
                    if (subdistrict.name.toLowerCase().includes(input)) {
                        const district = districts.find(d => d.code === subdistrict.code.slice(0, 5));
                        const province = provinces.find(p => p.code === district.code.slice(0, 2));
                        filteredSuggestions.push({
                            code: subdistrict.code,
                            name: subdistrict.name,
                            category: 'Kecamatan',
                            details: `Kabupaten/Kota: ${district ? district.name : 'Unknown'}, Provinsi: ${province ? province.name : 'Unknown'}`
                        });
                    }
                });

                locations.forEach(location => {
                    if (location.name.toLowerCase().includes(input)) {
                        const district = districts.find(d => d.code === location.code.slice(0, 5));
                        const province = provinces.find(p => p.code === district.code.slice(0, 2));
                        filteredSuggestions.push({
                            code: location.code,
                            name: location.name,
                            category: 'Desa/Kelurahan',
                            details: `Kecamatan: ${location.subdistrict}, Kabupaten/Kota: ${district ? district.name : 'Unknown'}, Provinsi: ${province ? province.name : 'Unknown'}`
                        });
                    }
                });

                filteredSuggestions.forEach(suggestion => {
                    const div = document.createElement('div');
                    div.classList.add('suggestion');

                    const header = document.createElement('div');
                    header.classList.add('suggestion-header');
                    header.innerHTML = `${suggestion.name} <span class="location-category">${suggestion.category}</span>`;
                    
                    const detailDiv = document.createElement('div');
                    detailDiv.classList.add('location-detail');
                    detailDiv.textContent = suggestion.details;
                    
                    div.onclick = () => {
                        showResult(suggestion.code);
                        suggestionsDiv.innerHTML = ''; 
                        suggestionsDiv.style.display = 'none'; 
                    };
                    
                    div.appendChild(header);
                    div.appendChild(detailDiv);
                    suggestionsDiv.appendChild(div);
                });
            } else {
                suggestionsDiv.style.display = 'none'; 
            }
        }

        function showResult(code) {
            const resultDiv = document.getElementById('result');
            const hasilAnchor = document.getElementById('hasil');

            resultDiv.style.display = 'block'; 
            hasilAnchor.textContent = code; 
            hasilAnchor.href = "/cuaca"; 

            sendToESP32(code); // Send the code to the ESP32 server
        }

        function sendToESP32(code) {
            const xhr = new XMLHttpRequest();
            xhr.open("POST", "/kode", true); // ESP32 will handle this route
            xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
            xhr.send("kode=" + encodeURIComponent(code)); // Send the code as part of POST data
        }

        window.onload = fetchData;
