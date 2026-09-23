file_path = "src/pages/Campus.tsx"
with open(file_path, "r") as f:
    content = f.read()

parts = content.split("{/* Collection Grid */}")

new_content = parts[0] + """{/* 3D City Map View */}
        <div className="mt-8">
          <CampusCityMap colleges={COLLEGES} unlockedRank={unlockedRank} />
        </div>
      </div>
    </div>
  );
}"""

with open(file_path, "w") as f:
    f.write(new_content)
